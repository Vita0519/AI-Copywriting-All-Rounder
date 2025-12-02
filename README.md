# 📝 AI 智能改写助手 (AI Rewriter)

> 专为 flyMD 设计的高级 AI 辅助插件。支持自定义提示词模版、弹窗式配置、强制 Markdown 格式输出。

***https://github.com/flyhunterl/flymd/tree/main?tab=readme-ov-file***

![Version](https://img.shields.io/badge/version-1.3.0-blue) ![Platform](https://img.shields.io/badge/platform-flyMD-green)

## ✨ 核心功能

本插件旨在让 AI 深度融入你的写作流，而不是简单的问答。

* **⚡️ 选中即改**：无需复制粘贴，选中一段文本，右键即可让 AI 润色、扩写或总结。
* **🎨 自定义模版**：内置“小红书爆款”、“商务邮件”等风格，支持用户无限添加自定义 Prompt。
* **🪟 现代化交互**：
    * **统一配置弹窗**：不再连续弹出输入框，一个表单一次性配置 API。
    * **可视化编辑**：在一个弹窗中编辑模版标题和长文本提示词。
* **📝 强制 Markdown**：系统级指令约束 AI 输出标准的 Markdown 格式，完美适配 flyMD 编辑器。
* **🔌 多模型兼容**：支持 OpenAI、DeepSeek (深度求索)、Moonshot (Kimi)、通义千问等所有兼容 OpenAI 协议的 API。

## 📦 安装指南

1.  打开 flyMD 的 **用户数据目录**：
    * Windows: `%APPDATA%\flyMD\plugins\`
    * macOS: `~/Library/Application Support/flyMD/plugins/`
2.  在 `plugins` 目录下新建文件夹：`ai-rewriter`。
3.  将插件的 `manifest.json` 和 `main.js` 文件放入该文件夹。
4.  重启 flyMD 或点击菜单栏 `View` -> `Reload`。

## ⚙️ API 配置

首次使用前，需要配置 AI 服务商。

1.  点击顶部菜单栏：**扩展 (Extensions)** -> **AI 改写** -> **⚙️ API 设置**。
2.  在弹出的表单中填写以下信息：

| 字段 | 说明 | 示例 (DeepSeek) | 示例 (Kimi/Moonshot) |
| :--- | :--- | :--- | :--- |
| **API Base URL** | 接口地址 | `https://api.deepseek.com` | `https://api.moonshot.cn/v1` |
| **Model Name** | 模型名称 | `deepseek-chat` | `moonshot-v1-8k` |
| **API Key** | 密钥 | `sk-xxxx...` | `sk-xxxx...` |

> **注意**：如果使用官方 OpenAI，URL 请填写 `https://api.openai.com/v1`。

## 🚀 使用方法

### 场景一：右键快速改写
1.  在编辑器中**选中**你需要处理的文本（一段话或一篇文章）。
2.  点击鼠标 **右键**。
3.  选择 **📝 AI 改写为...** -> 选择你想要的风格（如：✨ 小红书）。
4.  稍等片刻，AI 生成的内容将自动**替换**选中的文本。

### 场景二：主菜单调用
1.  选中特定文本。
2.  点击顶部菜单 **扩展** -> **AI 改写** -> **立即生成** -> 选择对应模版。

### 场景三：将选中文本存为新模版（快捷键）
如果你在编辑器里调试好了一段非常棒的 Prompt：
1.  选中这段 Prompt 文字。
2.  **右键** -> **💾 保存选中为新提示词**。
3.  在弹窗中输入标题（如“代码解释器”），保存即可。

## 🧩 模版管理

插件支持全功能的模版增删改查：

* **新增模版**：点击菜单 **➕ 新增模版 (表单)**，在弹窗中填入标题和 System Prompt。
* **编辑/删除**：点击菜单 **🔧 管理模版** -> 选择对应模版。
    * 弹窗询问：点击 **[取消]** 进入编辑模式；点击 **[确定]** 执行删除。

## 💡 提示词 (Prompt) 推荐

你可以将以下内容添加到自定义模版中：

**1. 知乎高赞体**
```text
请将选中的内容改写为知乎高赞回答风格。
要求：
- 开头使用“谢邀”或“利益相关”。
- 多用设问句和短句，逻辑严密但略带优越感。
- 通过讲故事来引入观点。
- 结尾进行升华。
- 使用 Markdown 格式。
