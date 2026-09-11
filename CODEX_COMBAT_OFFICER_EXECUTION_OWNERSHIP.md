# Codex campaign: combat officer execution ownership cleanup

## Purpose

Эта задача не является общим redesign всей command/officer системы.

Исходная проблема кампании (состояние до TASK 1):

- базовые параметры работы оборудования сейчас частично лежат в `Officer Task` tuning;
- `Player can cancel` хранится как authoring checkbox;
- runtime `OfficerTask` смешивает:
  - факт занятости офицера;
  - resolved progress;
  - design constants;
  - cancellation policy.

Целевая модель:

> Базовые параметры действия принадлежат системе/оборудованию, которое это действие производит.  
> Officer runtime хранит только текущую officer-owned execution и её resolved runtime progress.  
> Traits/status/effects позже могут модифицировать скорость выполнения, но не являются источником base duration.

Эта кампания специально разбита на отдельные законченные задачи.  
**Выполнять только одну задачу за один Codex-проход. Не начинать следующую автоматически.**

**Статус на 2026-09-11:** TASK 1 реализован и проверен локально; следующий запрос пользователя — передать
Web Chat контекст для выполнения только TASK 2. TASK 2/3 ещё не начаты. Реализация TASK 1 пока не закоммичена
и не отправлена в remote; `13f8c812305230f657646c5efb1d60f4a85fd6bd` — её исходный HEAD, а не результат.
Порядок продолжения и доступность исходников зафиксированы в `CURRENT_HANDOFF.md`.

После каждой задачи:

1. запустить `npm run typecheck`;
2. запустить релевантные tests, затем полный test suite, если это принято текущими repo rules;
3. проверить `git diff --check`;
4. кратко описать изменённые invariants и потенциальные follow-ups;
5. остановиться и дождаться review.

---

# Before every task

Web Chat начинает со свежего `master`, содержащего результаты предыдущего task.
Codex Local работает с текущим workspace по `docs/WORKING_RULES.md`.

Сначала прочитать:

- `CURRENT_HANDOFF.md`
- `docs/WORKING_RULES.md`
- только релевантные current-truth docs под конкретный atom

Локальная свежая версия репозитория авторитетнее этого файла.

Перед изменением каждого source/test файла получить его полное актуальное содержимое.

Не переоткрывать закрытые cleanup-решения без нового конкретного evidence.

Не делать generic event bus, service locator, universal command framework, generic phase state machine или конфигурационный DSL ради этой задачи.

---

# Original audited shape — before TASK 1

Аудит проводился на master `42fcf74e8b9500b093920db3bf70079f5ae056b2`.

Это исторический reference point. Перенос durations из списка ниже уже выполнен в TASK 1;
сохраняющийся cancellation path описан в implementation map TASK 2. Перед работой проверить свежий source.

Relevant current areas:

- `src/engine/content/catalogs/officer_tasks.ts`
- `src/engine/content/schemas/officer_task_tuning.ts`
- `src/engine/content/data/officer_tasks_*.json`
- `src/engine/defs/officer_task.ts`
- `src/engine/encounter/model/officer_task.ts`
- `src/engine/encounter/officer_tasks/OfficerTaskRunner.ts`
- `src/engine/encounter/officer_tasks/OfficerTaskEffects.ts`
- `src/engine/encounter/officer_tasks/create_officer_task_draft.ts`
- `src/engine/encounter/EncounterEngine.ts`
- `src/engine/encounter/combat/PlayerWeaponRunner.ts`
- concrete player weapon/system runners
- enemy `EnemyCrewTaskRunner` / `EnemyWorkExecutor`
- content schemas/definitions for weapons, defense turret, shield generator, drive
- `tools/content-editor/server/content_registry.ts`
- relevant tests under `tests/engine`, `tests/app`, content-editor tests if affected

Problem examples at the original audit:

- Missile targeting duration lives in Gunner Officer Task tuning.
- Sticky Mine targeting duration lives in Gunner Officer Task tuning.
- Player Defense Turret aiming duration lives in Gunner Officer Task tuning even though Defense Turret already has `loadDurationMs`.
- Shield deployment duration lives in Engineer Officer Task tuning although Shield Generator is the physical owner.
- Drive repair duration lives in Engineer Officer Task tuning although Drive is the physical owner.
- enemy work already mixes both approaches: some work reads equipment timing, while shield/purge/clear-mine still read Officer Task timing.
- `canBeCancelledByPlayer` is editable content data.
- `EncounterEngine.cancelTask()` checks that content-driven boolean.

---

# Domain rules locked for this campaign

## 1. Officer-owned execution

Во время combat officer может выполнять конкретную работу:

- Gunner targets a Missile Launcher;
- Gunner operates a Defense Turret;
- Engineer deploys a Shield;
- Engineer repairs Drive;
- Scientist purges SPAM;
- etc.

Пока officer-owned execution существует:

- officer считается busy;
- progress может отражаться в PEGS/presentation;
- crew-progress modifiers могут менять скорость выполнения;
- позже такую execution можно будет interrupt'ить.

После commit работа может перейти в autonomous lifecycle оборудования/effect/projectile.

Пример:

`Gunner targeting missile -> commit/launch -> projectile flies independently -> Gunner free`

Runtime officer execution не должна продолжаться только для того, чтобы удерживать projectile/effect alive.

## 2. Base timing ownership

Base timing хранится у настоящего domain owner.

Для текущей migration:

- Missile targeting -> Missile Launcher definition.
- Sticky Mine targeting -> Sticky Mine Dispenser definition.
- Defense Turret aiming/loading -> Defense Turret definition.
- Shield deployment -> Shield Generator definition.
- Drive repair -> Drive definition.

Existing timing that already belongs to equipment stays there.

Examples:

- Beam charge stays on Beam Cannon.
- Missile flight stays on Missile Launcher for now; do not redesign ammo ownership in this campaign.
- weapon cooldowns stay on weapon/equipment definitions.
- Evade timing stays on Drive.

## 3. Runtime duration may still exist

Не надо удалять `durationMs` из runtime object только ради архитектурной чистоты.

Допустимо:

- definition содержит base duration;
- при старте execution код resolves нужную duration;
- runtime execution хранит resolved `durationMs` и `elapsedMs`.

Запрещено:

- Officer Task content catalog остаётся source of truth для base equipment timing.

## 4. Crew slowdown semantics must stay

Сейчас timed officer work использует crew-progress multiplier.

Migration ownership не должна превратить officer work в raw world-time progress.

Должна сохраниться семантика:

`base work duration from equipment/action`
→ officer/crew modifiers
→ current combat modifiers such as SPAM
→ actual execution progress

Не менять баланс чисел без необходимости.

## 5. Editor stores data, not behavior policy

В content editor должны редактироваться числа оборудования.

Не добавлять authoring fields вроде:

- `interruptible`
- `canBeStunned`
- `cancelDuringPhase`
- `commitAtPercent`
- `operatorRequired`
- generic phase lists

Поведение phases/cancel/commit остаётся кодом конкретных mechanics.

## 6. Stun/interrupt are NOT part of this campaign

Не вводить сейчас:

- stun status;
- generic interrupt API;
- officer status machine;
- portrait state logic;
- neural recovery.

Требование только одно:

> новая runtime boundary не должна мешать позже реализовать  
> `stun officer -> if current officer-owned execution exists, interrupt it`.

Не строить инфраструктуру заранее.

## 7. Non-combat navigation is NOT being redesigned

Не переделывать сейчас:

- `DOCK`
- `FLY TO`
- `JUMP`
- общую navigation/order UI
- будущую non-combat dashboard command model

В будущем эти действия, вероятно, станут ship/navigation operations, а не combat-style officer skills.

Если combat cleanup технически касается этих task kinds, сделать минимальное изменение для сохранения текущего поведения.

Не использовать этот refactor как повод переписывать navigation.

`PLOT COURSE` также не redesign'ить в этой кампании без прямой необходимости.

## 8. SPAM lifecycle redesign is a later task

Не реализовывать сейчас:

- SPAM PREPARE/TARGETING;
- commit boundary;
- autonomous active payload;
- Scientist neural recovery;
- purged red-beam presentation.

Эта migration должна только подготовить чистый фундамент, после которого новый SPAM lifecycle можно реализовать отдельно.

---

# TASK 1 — Move combat equipment timings to real equipment owners

## Implementation status — 2026-09-11

Task 1 implemented in the local workspace from `13f8c812305230f657646c5efb1d60f4a85fd6bd`.
Validated locally; the user requested a handoff for Web Chat to implement TASK 2 next.
Tasks 2 and 3 have not been started. TASK 1 is still uncommitted/unpushed at this documentation refresh.

- Missile Launcher and Sticky Mine Dispenser now own `targetingDurationMs` (migrated value: 3000 ms).
- Defense Turret uses its existing `loadDurationMs` on both sides (3000 ms; no duplicate field).
- Shield Generator owns `deploymentDurationMs` (3000 ms), separate from shield lifetime and cooldown.
- Drive owns `repairDurationMs` (12000 ms); Evade parameters remain unchanged.
- Player command handlers resolve installed definitions into runtime task duration. Enemy targeting phases,
  shield work, captain planning and presentation timing read the same equipment owners.
- Equipment schemas export the existing editor duration control. Old equipment duration fields are rejected in
  role task records. Labels, cancellation policy, Plot Course/Purge SPAM/Clear Mine timing remain in role content.
- Live JSON and fixed scenario fixtures were migrated without changing balance. Existing lifecycle/cancel tests
  remain; new tests cover custom equipment durations, player/enemy SPAM slowdown, planning and editor metadata.
- Validation: typecheck and focused tests passed; full suite passed with 119 files / 381 tests.
- One editor CRUD assertion was also corrected: ship usage expectations now follow actual saved loadouts instead
  of assuming Player Test Ship still mounts a Mine Dispenser.

Current timing contracts are recorded in `docs/GAMEPLAY_CONTRACTS.md` and `docs/SYSTEM_MAP.md`.

## Goal

Убрать equipment-owned base duration из role-based Officer Task tuning и положить его в definitions соответствующего оборудования.

**В этом task нельзя удалять всю Officer Task tuning систему.**
**В этом task нельзя redesign'ить cancellation.**
**В этом task нельзя redesign'ить SPAM.**

Главная цель — ownership migration с сохранением поведения.

## Required migrations

### Missile Launcher

Добавить/использовать equipment field для targeting duration.

Current value должен остаться эквивалентным текущему Gunner Officer Task tuning.

Player missile targeting и enemy missile weapon operation должны получать duration из definition соответствующего launcher, а не из Officer Task catalog.

Если enemy missile targeting сейчас lifecycle-driven через weapon phase, сохранить существующую physical model; не вводить второй progress owner.

### Sticky Mine Dispenser

То же правило:

- targeting duration принадлежит dispenser definition;
- player/enemy paths используют definition;
- текущий баланс сохраняется.

### Defense Turret

У Defense Turret уже есть `loadDurationMs`.

Проверить player/enemy semantics и убрать отдельный player Gunner duration, если это действительно одно и то же действие.

Не заводить второй почти-эквивалентный field без конкретного evidence.

Оба sides должны опираться на canonical Defense Turret timing.

### Shield Generator

Добавить equipment-owned deployment duration, если его ещё нет.

Не путать:

- deployment duration;
- active shield duration;
- cooldown.

Player и enemy shield deployment должны брать base duration из конкретного Shield Generator definition.

### Drive repair

Добавить repair duration в Drive definition.

Player Engineer repair execution должна получать base duration из установленного Drive definition.

Не менять существующие Evade fields.

## Editor requirements

Соответствующие поля должны автоматически появиться в правильных equipment collections через schema metadata.

Использовать существующий `duration` editor control.

Не делать custom editor UI, если текущая schema-driven форма уже подходит.

Expected examples:

- Missile Launcher: Targeting Duration
- Sticky Mine Dispenser: Targeting Duration
- Defense Turret: existing Load Duration as canonical value
- Shield Generator: Deployment Duration
- Drive: Repair Duration

Names могут быть скорректированы под текущие naming conventions репозитория.

## Runtime requirement

Officer execution может по-прежнему получить resolved `durationMs`.

Но resolved duration должна приходить из equipment definition.

Не заставлять Officer Task content catalog оставаться промежуточным source of truth.

## Tests

Обязательно покрыть/обновить минимум:

- content schema parsing for new fields;
- factory/runtime definitions preserve the fields;
- player timing behavior unchanged;
- enemy timing behavior unchanged where corresponding mechanics exist;
- crew-progress slowdown still affects officer-owned timed work;
- editor/content registry still loads affected equipment collections.

Удалить только те old timing assertions, которые действительно стали obsolete.

## Acceptance criteria

Task 1 закончен, если:

- equipment-owned combat timing больше не читается из `getTimedOfficerTaskDurationMs(...)`;
- canonical values лежат у equipment definitions;
- player/enemy use the same owner for the same physical equipment mechanic;
- editor редактирует эти значения рядом с оборудованием;
- gameplay timings numerically match pre-refactor behavior;
- typecheck/tests green.

## Explicit non-goals

Не удалять в этом atom:

- all `officer_tasks_*.json`;
- `canBeCancelledByPlayer`;
- entire `OfficerTaskTuning` catalog;
- navigation task behavior;
- SPAM channel lifecycle.

После выполнения остановиться.

---

# TASK 2 — Remove content-driven Player Can Cancel policy

## Preconditions

Task 1 должен быть merged/reviewed/green.

Перед началом снова взять fresh `master`.

Убедиться, что полученный source уже содержит TASK 1: equipment definitions имеют новые duration fields,
а соответствующие Gunner/Engineer role records больше не содержат `durationMs`. Если remote всё ещё старый,
сначала требуется публикация пользователем готового TASK 1. Не собирать TASK 2 patch поверх старого HEAD
и не восстанавливать исходники TASK 1 по пересказу документа.

## Web Chat implementation map after TASK 1

Этот раздел даёт контекст для точечных чтений репозитория. Перед изменением файлов всё равно нужны их полные
актуальные preimages по `docs/WORKING_RULES.md`; сниппеты и этот документ не являются preimages для patch.

### Existing cancellation flow to replace

1. `src/engine/content/schemas/officer_task_tuning.ts`: `COMMON_OFFICER_TASK_TUNING_SHAPE` содержит boolean
   `canBeCancelledByPlayer` с editor title `Player can cancel`. Четыре role schema используют этот общий shape.
2. `src/engine/content/data/officer_tasks_{scientist,gunner,pilot,engineer}.json` и соответствующие секции
   `tests/fixtures/scenario_content.json` содержат boolean в каждом task record.
3. `src/engine/content/catalogs/officer_tasks.ts`: `getOfficerTaskCancellationPolicy(kind)` читает boolean
   из `OFFICER_TASK_TUNING`. Остальные helpers нужны для оставшихся task durations/labels.
4. `src/engine/defs/officer_task.ts` объявляет `OfficerTaskCancellationPolicy`;
   `src/engine/encounter/model/officer_task.ts` пересекает его с `OfficerTaskState`.
5. `src/engine/encounter/officer_tasks/OfficerTaskRunner.ts`, `createRuntimeTask`, добавляет policy из catalog
   в stored runtime. Его внутренний `cancel` выполняет domain cancellation; не превращать внутреннюю отмену
   при потере цели/инвалидации в player-only permission check.
6. `src/engine/encounter/EncounterEngine.ts`, `cancelTask`, сейчас читает `task.canBeCancelledByPlayer`.
   Неизвестный task ID — no-op; запрещённая отмена бросает `Officer task cannot be cancelled by player: id/kind`;
   разрешённая вызывает `OfficerTaskRunner.cancel`.
7. Два presentation consumer читают тот же boolean:
   `src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper.ts`
   (поиск cancellable weapon task) и
   `src/app/scenes/game/bridge/controller/captain_dashboard/defense_turret/BridgeDefenseTurretThreatsMapper.ts`
   (active intercept task). Им нужна та же code-derived legality, чтобы cancel action не расходился с engine.
   `src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController.ts` передаёт task ID
   в `EncounterEngine.cancelTask`; controller не владеет gameplay policy.

### Compatibility table from current role JSON

| Manual player cancellation | Task kinds |
| --- | --- |
| Forbidden | `PILOT_DOCK`, `PILOT_FLY_TO`, `SCIENTIST_FIRE_SPAM` |
| Allowed | `PILOT_JUMP`, `PILOT_EVADE`, `SCIENTIST_PLOT_COURSE`, `SCIENTIST_PURGE_SPAM` |
| Allowed | `GUNNER_DEFENSE_TURRET`, `GUNNER_FIRE_MISSILE`, `GUNNER_FIRE_STICKY_MINES`, `GUNNER_FIRE_BEAM_CANNON` |
| Allowed | `ENGINEER_REPAIR_DRIVE`, `ENGINEER_DEPLOY_SHIELD`, `CLEAR_STICKY_MINE` |

Это таблица текущего поведения, которое нужно сохранить кодом, а не новый authoring registry.
Простой явный engine policy/query допустим. Не дублировать отдельные списки правил в engine и app.
Если presentation нужен boolean, он должен вычисляться из engine policy; не хранить content-authored policy
в runtime и не переносить checkbox в equipment JSON.

Оставить реальные последствия отмены в текущих `OfficerTaskEffects` и concrete runners: free pre-release
Missile/Mine cancellation, отсутствие refund уже потраченного Core, существующие cooldown edges и task events.
Player SPAM остаётся запрещённым для manual cancel, в том числе после purge до конца исходной операции.
TASK 2 не исправляет асимметрии enemy SPAM или cooldown timing.

### Remaining role content is intentional

После удаления boolean остаются labels всех task kinds и durations Plot Course/Purge SPAM/Clear Mine.
Не удалять четыре role collections, catalog, labels или эти три durations в TASK 2.
`create_officer_task_draft.ts` уже принимает equipment-resolved duration в пяти migrated creators;
не возвращать туда `getOfficerTaskDraftTuning(kind)` для получения equipment timing.

### Tests and completion checkpoint

- Начать с `tests/engine/encounter/officer_task_cancellation.test.ts`; добавить/сохранить покрытие разрешённых
  и запрещённых kinds. Старые fixtures с boolean нужно обновить к новой модели, а не ослаблять behavior assertions.
- Проверить `player_spam_projector.test.ts`, `player_missile_command.test.ts`, `player_sticky_mine_command.test.ts`,
  `player_beam_cannon_command.test.ts`, `gunner_defense_turret_command.test.ts`, `player_shield_deploy.test.ts`,
  `engineer_repair_drive.test.ts` и Pilot navigation/Evade tests под `tests/engine/encounter/`.
- UI cancellation: `tests/app/BridgePlayerShipDashboardMapper.test.ts` и
  `tests/app/BridgePlayerDefenseTurretDashboardMapper.test.ts`; остальные synthetic task/event fixtures найти
  поиском `canBeCancelledByPlayer` по `tests/`.
- Content/editor: `tests/engine/content/officer_task_tuning.test.ts`,
  `tests/tools/content_editor_registry.test.ts`, role JSON и fixed scenario content. Проверить, что старый boolean
  отвергается strict schema и отсутствует в editor schema, при этом оставшиеся role fields валидны.
- Сохранить новые TASK 1 tests `equipment_execution_timing.test.ts` и `equipment_execution_tuning.test.ts`:
  equipment ownership, SPAM slowdown и schema metadata не должны регрессировать.
- Проверки: `npm run typecheck`, focused tests, полный `npm test`, `git -c core.safecrlf=false diff --check`.
  TASK 1 baseline: 119 файлов / 381 тест. Для Web Chat patch также нужен `git apply --check` на exact preimages.
- Обновить статус TASK 2 и хэндофф с фактически выполненными проверками; остановиться до TASK 3.
  Если среда Web Chat не позволяет запускать тесты, явно передать пользователю команды проверки и не заявлять green.

## Goal

Удалить `Player can cancel` как editable content data.

Cancellation является gameplay rule, а не tuning parameter.

В этом task **не нужно** вводить stun/interrupt и **не нужно** redesign'ить navigation.

## Target rule

Для combat officer-owned work cancellation должна определяться кодом текущей execution/mechanic, а не checkbox'ом из JSON.

До нового SPAM lifecycle необходимо сохранить текущее observable behavior там, где изменение semantics ещё не было отдельно согласовано.

Это значит:

- не делать неожиданно cancellable уже-committed/active SPAM только потому, что field удалён;
- не менять navigation semantics ради унификации;
- не добавлять generic configurable cancellation matrix.

Допустим explicit code-level policy/switch как переходный шаг, если он простой и честно отражает текущую механику.

Главное — policy больше не authoring data.

## Required cleanup

Удалить из content schema/data/editor:

- `canBeCancelledByPlayer`;
- editor field `Player can cancel`.

Удалить/заменить API вроде `getOfficerTaskCancellationPolicy(...)`, если после migration у него больше нет смысла.

Runtime `OfficerTaskState` не должен хранить content-authored cancellation boolean.

Если presentation/API нужен способ понять, можно ли сейчас cancel task, использовать code-derived query/policy.

Не создавать generic policy framework.

## Navigation rule

`DOCK / FLY TO / JUMP` не redesign'ить.

Если для сохранения их текущей semantics нужен explicit code branch — это нормально.

Этот task не решает будущую non-combat order system.

## Tests

Обязательно проверить:

- текущие разрешённые player cancellations всё ещё разрешены;
- текущие запрещённые остаются запрещены;
- отсутствие content boolean не меняет gameplay случайно;
- content editor больше не показывает `Player can cancel`;
- stale JSON fields удалены;
- typecheck/tests green.

## Acceptance criteria

Task 2 закончен, если:

- ни один authoring JSON/schema не содержит `canBeCancelledByPlayer`;
- runtime cancellation decision выводится из кода/mechanic;
- current observable behavior сохранено;
- navigation не redesign'нута;
- stun/interrupt не добавлены;
- typecheck/tests green.

После выполнения остановиться.

---

# TASK 3 — Remove obsolete Officer Task tuning surface and keep runtime execution thin

## Preconditions

Tasks 1 and 2 merged/reviewed/green.

Перед началом снова взять fresh `master`.

## Goal

После переноса durations и cancellation policy role-based `Officer Task` content tuning, вероятно, останется только ради labels или уже не будет иметь полезного design ownership.

Нужно удалить obsolete authoring surface и оставить runtime `OfficerTask` как execution/assignment record.

## Important: inspect before deleting

Перед изменениями проверить fresh repo:

- что именно осталось в `officer_tasks_*.json`;
- кто читает `label`;
- где task label нужен presentation/UI;
- какие tests реально завязаны на catalog.

Не удалять файлы автоматически только потому, что этот документ предполагает, что они станут пустыми.

Удалять только после доказательства, что ownership переехал.

## Target runtime model

`OfficerTask`/execution может хранить:

- runtime id;
- role;
- kind;
- source command/action identity;
- target/equipment references;
- resolved `durationMs`, если task timed;
- `elapsedMs`;
- task-specific runtime context.

Он не должен владеть:

- base equipment timing source;
- authoring cancellation policy;
- redundant tuning records только ради исторической структуры.

Не переименовывать `OfficerTask` только ради naming cleanup, если это раздует diff.

Переименование в `OfficerExecution` — только если fresh code делает это очевидно маленьким и реально уменьшает cognitive load. Иначе оставить имя.

## Labels

Если old Officer Task tuning нужен только ради `label`, убрать этот artificial ownership.

Предпочитать существующие честные presentation owners, например command/action definition, если label уже там существует.

Не плодить новый глобальный label registry.

Не менять player-visible text без необходимости.

## Editor cleanup

Если role-based Officer Task collections больше не содержат design data:

- удалить их из content registry;
- удалить group/collection ids, которые стали dead;
- удалить obsolete schemas/catalog/data;
- удалить связанные tests.

Content editor после task не должен показывать пустую/бессмысленную `Officer Tasks` tuning группу.

## Runtime behavior

Сохранить:

- busy-role semantics;
- task identity;
- timed progress;
- task completion events;
- cancellation behavior из Task 2;
- crew slowdown;
- current navigation behavior;
- current weapon/system behavior.

Не вводить новую state machine.

## Tests

Обязательно проверить:

- officer busy/availability;
- command execution blocking by busy officer;
- task lifecycle events;
- timed progress;
- cancellation;
- navigation smoke coverage;
- affected combat mechanics;
- content editor registry/schema tests;
- typecheck/full tests green.

## Acceptance criteria

Task 3 закончен, если:

- Officer Task content tuning больше не существует без реального design ownership;
- runtime task остаётся простой execution record;
- equipment/action definitions являются sources of design timing;
- no `Player can cancel` authoring;
- no stun/interrupt implementation;
- no navigation redesign;
- no SPAM lifecycle redesign;
- typecheck/tests green.

После выполнения остановиться и вернуться на design/code review.

---

# After this campaign — NOT PART OF TASKS 1–3

Следующий отдельный gameplay atom после review:

## New SPAM lifecycle

Planned semantics:

1. Scientist starts SPAM PREPARE/TARGETING.
2. PREPARE is officer-owned execution.
3. Yellow progress grows left -> right.
4. Before commit player can cancel; future stun/interrupt will also be able to stop this execution.
5. At commit payload launches.
6. Scientist officer execution ends.
7. SPAM ACTIVE continues autonomously for equipment-defined duration.
8. Scientist enters separate neural-recovery state for its own equipment-defined duration.
9. ACTIVE tile progress uses bright cyan and counts remaining time right -> left.
10. Purge ends target effect but does not shorten nominal SPAM equipment active/recovery cycle.
11. Purged beam/effect should later receive red visual feedback instead of persistent `PURGED` tile text.
12. Cooldown remains an equipment lifecycle independent from officer availability.

Do not implement this during Tasks 1–3.

---

# Future extension boundary — NOT IMPLEMENTED NOW

Later officer presentation may expose states such as:

- IDLE
- WORKING
- STUNNED
- NEURAL_RECOVERY

Portraits/animations may depend on those states.

Important conceptual split:

- `WORKING` comes from current officer-owned execution;
- `STUNNED` / `NEURAL_RECOVERY` are officer status/effects;
- autonomous equipment/projectile/effect lifecycle is neither of those.

Future stun rule:

> stun may be applied to an officer at any time;  
> if an officer-owned execution exists at that moment, stun can interrupt that execution;  
> autonomous work already committed must not be recalled automatically.

This is only a compatibility requirement for today's architecture.  
Do not implement it in Tasks 1–3.

---

# Guardrails for Codex

- Prefer explicit code over generic abstractions.
- No architecture for hypothetical future mechanics.
- No universal action/phase DSL.
- No editor checkboxes for gameplay semantics.
- No hidden fallback to old Officer Task timing once ownership is migrated.
- Avoid duplicating the same timing in two places.
- Keep player/enemy mechanics symmetric when they represent the same physical equipment behavior.
- Preserve current numeric balance unless migration requires an explicit equivalent value.
- Keep diffs reviewable.
- One task per run.
- Stop after green validation and summarize exactly what changed.
