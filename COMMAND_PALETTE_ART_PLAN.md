# Space Captain — Command Palette Art Plan

План проектирования и отрисовки новой command palette для мостика.

Этот файл фиксирует **процесс**, а не финальный дизайн.  
Перед кодом сначала делаем скетчи, проверяем композицию и только затем собираем atlas assets.

---

# 1. Цель

Заменить старое вертикальное текстовое context menu на постоянную горизонтальную command palette.

Palette должна:

- читаться за долю секунды во время боя;
- сохранять постоянное расположение команд;
- не перекрывать важную часть мостика и viewscreen;
- поддерживать мышь и будущий gamepad;
- выглядеть частью капитанского интерфейса, а не современным HUD;
- соответствовать раннему Sierra VGA / Space Quest V вайбу;
- оставаться простой и игровой, без cockpit clutter.

Главное правило:

```text
сначала композиция и UX
→ потом визуальный язык
→ потом финальные спрайты
→ потом код
```

---

# 2. Завтрашний порядок работы

## Этап A — быстрые композиционные скетчи

Сначала делаем несколько грубых чёрно-белых или двухцветных вариантов без детальной пиксельной отрисовки.

Нужно проверить минимум три композиции:

### Вариант A — единая нижняя полоса

```text
[ ROLE ] [ SLOT ][ SLOT ][ SLOT ][ SLOT ][ CANCEL ]
```

- palette занимает центральную нижнюю часть экрана;
- choice-row появляется непосредственно над ней;
- subtitle/status strip находится под слотами или внутри нижней рамки.

### Вариант B — palette встроена в капитанский стол

```text
foreground captain desk
└─ command slots как физические клавиши/экраны
```

- меньше ощущения отдельного HUD;
- сильнее связь с bridge background;
- риск: может потребовать слишком много переделок окружения.

### Вариант C — центральная palette с боковыми status blocks

```text
[ role/status ] [ command slots ] [ task/cancel ]
```

- основная сетка остаётся стабильной;
- роль и активная задача читаются отдельно;
- риск: полоса может стать слишком широкой и тяжёлой.

Для каждого варианта проверяем:

- читается ли он поверх текущего bridge background;
- не спорит ли с officer seats;
- не закрывает ли missile/mines/laser presentation;
- хватает ли места для 5–7 основных слотов;
- можно ли добавить choice-row без скачка всей композиции;
- удобно ли будет выбирать мышью;
- получится ли позже навигация крестовиной/gamepad.

До выбора композиции финальные пиктограммы не рисуем.

---

# 3. UX-flow, который должен поддерживать дизайн

## Выбор офицера

```text
клик по officer station
или клавиша 1–5
→ palette переключается на выбранную роль
```

Palette всегда остаётся на одном месте.

Слоты не должны прыгать при временной недоступности команды.

```text
доступно
→ нормальный slot

недоступно
→ тот же slot, но disabled

команда отсутствует физически
→ slot не создаётся
```

Последнее относится, например, к неустановленному оружию.

## Прямая команда

```text
клик по slot
→ execute
```

## Команда с выбором

```text
клик по slot
→ открывается compact choice-row
→ выбор конкретной resolved command
→ execute
```

Choice-row нужен для:

- laser target zone: LEFT / CENTER / RIGHT;
- shield zone: LEFT / CENTER / RIGHT;
- point defense: конкретная угроза + spectral band;
- identify threat: конкретная угроза;
- Fly To / Hail / Dock, если появляется несколько целей.

## Физическое оружие

Каждый установленный экземпляр имеет отдельный постоянный слот:

```text
missile launcher #1
missile launcher #2
sticky mine dispenser #1
laser #1
```

Runtime `weaponId` не показывается игроку напрямую, но slot должен сохранять identity конкретного устройства.

## Активная задача

Если у роли есть cancellable task:

```text
CANCEL TASK
→ отдельный фиксированный последний slot
```

Если task нельзя отменить или task отсутствует:

```text
slot остаётся на месте
→ disabled
```

---

# 4. Композиционные решения, которые надо принять на скетчах

Перед финальной отрисовкой нужно ответить на вопросы:

1. Palette является отдельным HUD-окном или частью captain desk?
2. Какая максимальная ширина допустима при 1280×720?
3. Где находится название выбранной роли?
4. Где показывается tooltip / subtitle команды?
5. Choice-row открывается вверх, вбок или заменяет основной ряд?
6. Нужны ли визуальные группы внутри роли:
   - GENERAL;
   - TARGET;
   - WEAPONS;
   - TASK.
7. Должны ли слоты иметь подписи постоянно или только при hover/selection?
8. Как различить:
   - disabled;
   - selected;
   - pressed;
   - active task;
   - cooldown / temporarily unavailable.
9. Нужна ли отдельная индикация hotkey/gamepad binding?
10. Как palette выглядит при открытом node object list и других overlay?

---

# 5. Предварительные размеры

Это стартовые размеры для скетчей, а не locked final values.

## Основной slot

```text
48×48 px
```

Пиктограмма внутри:

```text
примерно 28–32 px
```

Рекомендуемая область безопасного рисунка:

```text
4–8 px внутреннего отступа
```

## Choice-row slot

Можно начать с:

```text
40×32 px
или
48×32 px
```

Choice-row должен быть легче основного ряда и не выглядеть второй полноценной панелью.

## Subtitle strip

Высота:

```text
16–24 px
```

Задача полосы:

- название команды;
- короткий статус;
- название цели;
- причина disabled, если это действительно нужно игроку.

Не превращать subtitle в длинный help text.

---

# 6. Визуальный язык

Ориентир:

- early-1990s Sierra VGA;
- chunky readable pixels;
- ограниченная палитра;
- простые bevel/recessed формы;
- слегка потёртый рабочий корабль;
- понятнее, чем реалистично;
- комедийный sci-fi без игрушечной несерьёзности.

Не использовать:

- modern flat UI;
- прозрачные glass panels;
- тонкие neon outlines;
- мобильные rounded cards;
- мелкую cockpit-разметку;
- десятки декоративных кнопок;
- сложные metallic gradients;
- слишком подробные пиктограммы.

Palette должна выглядеть как простой корабельный command console:

```text
толстая рамка
+ утопленные или физические клавиши
+ сильные состояния
+ минимум мелкой детализации
```

---

# 7. Состояния slot

Нужно нарисовать и проверить пять состояний:

```text
IDLE
HOVER
PRESSED
DISABLED
SELECTED
```

## IDLE

- основной нейтральный вид;
- пиктограмма читается;
- не конкурирует с viewscreen.

## HOVER

- заметен без сильной вспышки;
- может подсвечиваться рамка или внутренняя поверхность;
- не менять размер slot.

## PRESSED

- короткое физическое вдавливание;
- допустим сдвиг содержимого на 1 px;
- не должен выглядеть как permanent selected.

## DISABLED

- команда остаётся узнаваемой;
- нельзя просто сделать её почти невидимой;
- сниженная яркость и контраст;
- tooltip/subtitle может объяснять причину.

## SELECTED

Используется, когда открыт choice-row или slot выбран gamepad-навигацией.

- сильнее hover;
- не путать с active/cooldown;
- желательно отдельная рамка, лампа или marker.

---

# 8. Пиктограммы

Пиктограммы должны читаться в маленьком размере без подписей.

Первичный список:

```text
hail
request_docking
plot_course
identify_threat
purge_spam
deploy_shield
repair_drive
point_defense
missile_launcher
sticky_mine_dispenser
laser
dock
fly_to
jump
clear_mine
cancel_task
```

Правила:

- одна сильная идея на icon;
- минимум внутренней детализации;
- крупный силуэт;
- не использовать мелкий текст внутри icon;
- не кодировать смысл только цветом;
- похожие действия должны отличаться силуэтом;
- missile launcher, mine dispenser и laser должны выглядеть как разные физические устройства;
- deploy shield должен отличаться от shield status indicator;
- clear mine не должен выглядеть как fire mines;
- cancel task не должен выглядеть как закрытие обычного окна.

На этапе скетчей можно использовать временные символы и буквы.  
Финальные icon sprites рисуются только после утверждения palette composition.

---

# 9. Atlas frame plan

Предварительные frame keys.

## Основная панель

```text
bridge/ui/command_palette/panel_left
bridge/ui/command_palette/panel_middle
bridge/ui/command_palette/panel_right
```

## Основные slot states

```text
bridge/ui/command_palette/slot_idle
bridge/ui/command_palette/slot_hover
bridge/ui/command_palette/slot_pressed
bridge/ui/command_palette/slot_disabled
bridge/ui/command_palette/slot_selected
```

## Subtitle / choice-row shell

```text
bridge/ui/command_palette/subtitle_left
bridge/ui/command_palette/subtitle_middle
bridge/ui/command_palette/subtitle_right
```

После скетчей отдельно решаем, нужны ли отдельные frames для choice-row или он использует уменьшенный вариант основного slot.

## Icons

```text
bridge/ui/command_palette/icons/hail
bridge/ui/command_palette/icons/request_docking
bridge/ui/command_palette/icons/plot_course
bridge/ui/command_palette/icons/identify_threat
bridge/ui/command_palette/icons/purge_spam
bridge/ui/command_palette/icons/deploy_shield
bridge/ui/command_palette/icons/repair_drive
bridge/ui/command_palette/icons/point_defense
bridge/ui/command_palette/icons/missile_launcher
bridge/ui/command_palette/icons/sticky_mine_dispenser
bridge/ui/command_palette/icons/laser
bridge/ui/command_palette/icons/dock
bridge/ui/command_palette/icons/fly_to
bridge/ui/command_palette/icons/jump
bridge/ui/command_palette/icons/clear_mine
bridge/ui/command_palette/icons/cancel_task
```

Frame keys можно скорректировать до начала кода, но после подключения view они должны стать стабильными.

---

# 10. Sketch deliverables

Перед финальной отрисовкой должны быть готовы:

1. Три грубых full-screen composition mockup.
2. Один выбранный вариант поверх актуального bridge screenshot.
3. Состояния palette для:
   - COMMS;
   - SCIENCE;
   - WEAPONS;
   - ENGINEER;
   - HELM.
4. Пример Weapons palette с несколькими физическими weapons.
5. Пример choice-row для laser zones.
6. Пример point-defense choice без третьего уровня меню.
7. Пример disabled slots.
8. Пример cancellable task и disabled CANCEL TASK.
9. Проверка palette вместе с:
   - enemy ship;
   - missile threat;
   - sticky mines;
   - laser warning;
   - node object list.
10. Минимальный gamepad navigation sketch.

---

# 11. Art production order

После утверждения композиции:

```text
1. panel shell
2. slot states
3. subtitle / choice-row shell
4. 3–4 ключевые icons
5. runtime mockup в игре или на screenshot
6. корректировка размеров и контраста
7. остальные icons
8. atlas build
9. code integration
10. runtime polish
```

Не рисовать сразу все 16 icons до проверки первых четырёх в реальном масштабе.

Для первого визуального теста достаточно:

```text
hail
identify_threat
missile_launcher
cancel_task
```

Они дают разные типы силуэтов и позволяют проверить читаемость системы.

---

# 12. Acceptance criteria для арта

Композиция считается готовой к коду, когда:

- palette не закрывает ключевые боевые объекты;
- роль и выбранная команда читаются без поиска глазами;
- disabled slot остаётся узнаваемым;
- hover, pressed и selected не путаются;
- choice-row не двигает всю основную palette;
- два одинаковых launcher slots остаются визуально различимыми как отдельные устройства;
- icon читается при масштабе 1:1;
- panel не выглядит современным overlay;
- интерфейс сочетается с текущим bridge background;
- нет необходимости добавлять текстовые костыли к каждой кнопке;
- layout выдерживает минимум 7 основных slots плюс CANCEL TASK;
- итоговые frame keys и размеры зафиксированы.

---

# 13. Code handoff после готовности assets

После atlas build код делается одним вертикальным срезом:

```text
engine available commands/tasks
→ palette controller snapshot
→ stable role slot definitions
→ enabled/disabled resolved commands
→ palette view
→ choice-row
→ command execution / task cancel
→ keyboard support
→ удалить старый command menu polling/view
→ tests
```

Важно:

- не украшать старое context menu;
- не поддерживать две полноценные command UI параллельно дольше необходимого;
- не начинать view implementation до появления реальных atlas frames;
- временные placeholders допустимы только в отдельном test/mock harness, не в основном bridge view.

---

# 14. Первый шаг завтра

```text
открыть актуальный bridge screenshot
→ поверх него сделать 3 грубых композиционных скетча
→ выбрать направление
→ уточнить размеры
→ только затем обсуждать стиль рамок и icon language
```

Первая сессия посвящена композиции и UX, а не красивой финальной отрисовке.
