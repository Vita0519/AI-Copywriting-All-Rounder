// main.js

// ---------------- 默认配置与常量 ----------------

const DEFAULT_CONFIG = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  apiKey: ''
};

const DEFAULT_TEMPLATE_ID = 'default_xhs';

// 默认的小红书提示词
const XHS_PROMPT = `
你是一个拥有百万粉丝的小红书博主，也是文案写作专家。请根据用户输入的主题或内容，创作一篇小红书风格的笔记。

要求如下：
1. 标题：极具吸引力，使用“二极管”标题法（如：真的绝了！后悔没早知道！），包含Emoji。
2. 语气：热情、活泼、亲切、分享欲强。多用“家人们”、“集美们”、“绝绝子”、“yyds”、“一定要冲”等口语化词汇。
3. 排版：
   - 全文大量使用Emoji（🌈✨🔥💡📌等）穿插在文字中。
   - 适当分段，使用简单的符号（如 👉、✅）列出重点。
   - 视觉上要轻松易读，拒绝大段纯文字。
4. 结构：
   - 吸引人的标题
   - 痛点/场景引入
   - 核心干货/种草点
   - 结尾互动（求关注/点赞）
   - 底部堆砌 5-8 个相关话题标签（#Tag）。
5. 输出：不要输出Markdown代码块，直接输出正文内容。
`;

// 用于存储销毁函数，以便刷新菜单
let menuDisposers = [];

// ---------------- 生命周期 ----------------

export async function activate(context) {
  // 初始化模版管理器
  const templateManager = new TemplateManager(context);
  await templateManager.init();

  // 渲染菜单
  await refreshMenus(context, templateManager);

  context.ui.notice('AI 文案助手已激活 (支持自定义模版)', 'ok');
}

export function deactivate() {
  // 清理所有注册的菜单
  disposeMenus();
}

// ---------------- 菜单管理逻辑 ----------------

function disposeMenus() {
  menuDisposers.forEach(dispose => dispose());
  menuDisposers = [];
}

/**
 * 刷新菜单：当模版发生变化时调用此方法重新生成菜单结构
 */
async function refreshMenus(context, templateManager) {
  // 1. 清理旧菜单
  disposeMenus();

  const templates = templateManager.getAll();

  // 2. 构造【生成文案】的子菜单项
  const generateSubmenus = templates.map(tpl => ({
    label: tpl.name,
    note: tpl.id === DEFAULT_TEMPLATE_ID ? '默认' : '',
    onClick: async () => {
      await handleGenerateFromTopic(context, tpl.content);
    }
  }));

  // 3. 构造【删除模版】的子菜单项
  // 过滤掉默认模版，默认模版不允许删除
  const deleteSubmenus = templates
    .filter(t => t.id !== DEFAULT_TEMPLATE_ID)
    .map(tpl => ({
      label: `🗑️ 删除: ${tpl.name}`,
      onClick: async () => {
        const confirm = await context.ui.confirm(`确定要删除模版“${tpl.name}”吗？`);
        if (confirm) {
          await templateManager.delete(tpl.id);
          await refreshMenus(context, templateManager); // 刷新菜单
          context.ui.notice('模版已删除', 'ok');
        }
      }
    }));

  if (deleteSubmenus.length === 0) {
    deleteSubmenus.push({ label: '暂无自定义模版', disabled: true });
  }

  // 4. 注册主菜单 (Main Menu)
  const removeMainMenu = context.addMenuItem({
    label: 'AI 文案助手',
    children: [
      { type: 'group', label: '✨ 根据主题生成' },
      ...generateSubmenus, // 动态展开所有模版
      { type: 'divider' },
      { type: 'group', label: '🔧 设置与管理' },
      {
        label: '模版管理 (删除)',
        children: deleteSubmenus
      },
      {
        label: '⚙️ 配置 API Key',
        onClick: () => openSettings(context)
      }
    ]
  });
  menuDisposers.push(removeMainMenu);

  // 5. 构造【右键润色】的子菜单项
  const rewriteSubmenus = templates.map(tpl => ({
    label: tpl.name,
    icon: '✨',
    onClick: async (ctx) => {
      await handleRewriteSelection(context, ctx.selectedText, tpl.content);
    }
  }));

  // 6. 注册右键菜单 (Context Menu)
  const removeContextMenu = context.addContextMenuItem({
    label: 'AI 文案助手',
    icon: '🤖',
    children: [
      { type: 'group', label: '润色/改写为...' },
      ...rewriteSubmenus,
      { type: 'divider' },
      {
        label: '➕ 将选中设为新模版',
        icon: '💾',
        condition: (ctx) => ctx.selectedText.length > 5, // 至少选中5个字才能存为模版
        onClick: async (ctx) => {
          await handleSaveSelectionAsTemplate(context, templateManager, ctx.selectedText);
        }
      }
    ]
  });
  menuDisposers.push(removeContextMenu);
}

// ---------------- 业务逻辑处理 ----------------

/**
 * 将当前选中的文本保存为新模版
 */
async function handleSaveSelectionAsTemplate(context, manager, text) {
  // 提示输入模版名称
  // 由于 flyMD 暂时没有 input dialog API，使用原生 prompt
  const name = prompt('请输入新模版名称 (例如：知乎高赞体):');
  
  if (!name || !name.trim()) {
    context.ui.notice('已取消保存', 'err');
    return;
  }

  const newTpl = {
    id: Date.now().toString(), // 简单生成唯一ID
    name: name.trim(),
    content: text.trim()
  };

  await manager.add(newTpl);
  await refreshMenus(context, manager); // 关键：刷新菜单以显示新模版
  
  context.ui.showNotification(`模版“${newTpl.name}”保存成功！`, { type: 'success' });
}

async function handleGenerateFromTopic(context, systemPrompt) {
  const config = await loadConfig(context);
  if (!config.apiKey) return missingKeyHandler(context);

  const topic = prompt('请输入主题或关键词：');
  if (!topic) return;

  await callAIAndInsert(context, config, topic, systemPrompt);
}

async function handleRewriteSelection(context, selectedText, systemPrompt) {
  const config = await loadConfig(context);
  if (!config.apiKey) return missingKeyHandler(context);

  const loadingId = context.ui.showNotification('AI 正在思考中... 🧠', { type: 'info', duration: 0 });

  try {
    const result = await requestOpenAI(context, config, selectedText, systemPrompt);
    // 替换选区
    const sel = context.getSelection();
    context.replaceRange(sel.start, sel.end, result);
    
    context.ui.hideNotification(loadingId);
    context.ui.showNotification('改写完成 ✨', { type: 'success' });
  } catch (error) {
    context.ui.hideNotification(loadingId);
    context.ui.showNotification('失败: ' + error.message, { type: 'error' });
  }
}

async function callAIAndInsert(context, config, topic, systemPrompt) {
  const loadingId = context.ui.showNotification(`正在生成...`, { type: 'info', duration: 0 });

  try {
    // 构造 Prompt：如果是生成模式，我们告诉 AI 用户输入的是主题
    const userPrompt = `请根据以下主题创作：${topic}`;
    const result = await requestOpenAI(context, config, userPrompt, systemPrompt);
    
    context.insertAtCursor(result);
    context.ui.hideNotification(loadingId);
    context.ui.showNotification('生成完毕 ✨', { type: 'success' });
  } catch (error) {
    context.ui.hideNotification(loadingId);
    context.ui.showNotification('请求失败: ' + error.message, { type: 'error' });
  }
}

// ---------------- 模版管理器 (Data Layer) ----------------

class TemplateManager {
  constructor(context) {
    this.context = context;
    this.storageKey = 'custom_templates';
    this.templates = [];
  }

  async init() {
    const saved = await this.context.storage.get(this.storageKey);
    if (saved && Array.isArray(saved)) {
      this.templates = saved;
    }
    // 确保始终包含默认的小红书模版，且放在第一位
    this.ensureDefault();
  }

  ensureDefault() {
    // 检查是否已有默认模版
    const hasDefault = this.templates.some(t => t.id === DEFAULT_TEMPLATE_ID);
    if (!hasDefault) {
      this.templates.unshift({
        id: DEFAULT_TEMPLATE_ID,
        name: '✨ 小红书爆款 (默认)',
        content: XHS_PROMPT
      });
    }
  }

  getAll() {
    return this.templates;
  }

  async add(template) {
    this.templates.push(template);
    await this.save();
  }

  async delete(id) {
    if (id === DEFAULT_TEMPLATE_ID) return; // 禁止删除默认
    this.templates = this.templates.filter(t => t.id !== id);
    await this.save();
  }

  async save() {
    // 保存前移除默认模版（可选，为了节省空间，或者每次 init 时合并），
    // 这里选择全部保存，简化逻辑
    await this.context.storage.set(this.storageKey, this.templates);
  }
}

// ---------------- 网络请求与工具 ----------------

async function requestOpenAI(context, config, userContent, systemContent) {
  const payload = {
    model: config.model,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent }
    ],
    temperature: 0.8
  };

  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await context.http.fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Status ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'API 返回为空';
}

function missingKeyHandler(context) {
  context.ui.showNotification('请先配置 API Key', { type: 'error' });
  openSettings(context);
}

// ---------------- 设置 ----------------

async function loadConfig(context) {
  return {
    baseUrl: await context.storage.get('baseUrl') || DEFAULT_CONFIG.baseUrl,
    model: await context.storage.get('model') || DEFAULT_CONFIG.model,
    apiKey: await context.storage.get('apiKey') || ''
  };
}

export function openSettings(context) {
  (async () => {
    const current = await loadConfig(context);
    const baseUrl = prompt('API Base URL:', current.baseUrl);
    if (baseUrl === null) return;
    const model = prompt('模型名称:', current.model);
    if (model === null) return;
    const apiKey = prompt('API Key:', current.apiKey);
    if (apiKey === null) return;

    await context.storage.set('baseUrl', baseUrl);
    await context.storage.set('model', model);
    await context.storage.set('apiKey', apiKey);
    context.ui.notice('配置已更新 ✅', 'ok');
  })();
}
