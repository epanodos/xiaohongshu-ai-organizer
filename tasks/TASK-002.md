---
id: "TASK-002"
title: "实现两个 Skill 和动作计划保护工具"
status: "done"
milestone: "MS-001"
phase: "PH-002"
depends_on: ["TASK-001"]
updated_at: "2026-09-15"
---

# TASK-002｜实现两个 Skill 和动作计划保护工具

## 交付物

- `skills/xhs-published-cleanup/`
- `skills/xhs-favorites-organizer/`

## 验收条件

- [x] 两个 Skill 可独立触发。
- [x] 保护名单不能进入删除队列。
- [x] 计划变化使确认哈希失效。
- [x] 风控和登录失效有强制停止条件。
