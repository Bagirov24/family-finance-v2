# ТЗ: модуль шаблонного бюджетирования для Family Finance v2

## 1. Общая информация

### 1.1 Название
**Budget Templates & Smart Budgeting**

### 1.2 Цель
Реализовать в Family Finance v2 модуль бюджетирования, который помогает пользователю:

- выбрать готовый шаблон бюджета;
- автоматически распределить доходы и расходы по смысловым корзинам;
- видеть план/факт по бюджету;
- понимать, сколько можно безопасно потратить;
- получать ранние предупреждения о перерасходе;
- связывать бюджет с накоплениями, долгами и целями;
- использовать личный или семейный режим бюджета.

### 1.3 Контекст продукта
Family Finance v2 уже развивается как household-first приложение с транзакциями, счетами, категориями, бюджетами и целями накоплений. Модуль встраивается в существующую архитектуру, а не живёт отдельно.

### 1.4 Базовый принцип
Логика опирается на правило 50/30/20: бюджет считается от чистого дохода, после чего деньги делятся на:
- **needs** — обязательные расходы (50%)
- **wants** — гибкие расходы (30%)
- **savings** — накопления и доп. платежи по долгам (20%)

Классическая трактовка использует доход после налогов. `wants` ограничивается сверху, `savings/debt` задаёт целевой минимум.

### 1.5 Подход для СНГ
Модуль не жёсткое «правильное правило», а адаптивный набор шаблонов. Высокая доля обязательных расходов, наличные траты и зарплата частями делают классический 50/30/20 не всегда реалистичным.

---

## 2. Продуктовая логика

### 2.1 Что делает фича
Пользователь выбирает шаблон бюджета, система берёт доход за период, рассчитывает лимиты для трёх корзин и автоматически раскладывает туда операции. После этого приложение показывает, где всё идёт по плану, где есть риск перерасхода и сколько денег можно безопасно потратить до конца периода.

### 2.2 Логические корзины

| Код | RU | Назначение |
|---|---|---|
| `needs` | Обязательные расходы | Аренда, ЖКХ, продукты, транспорт, мин. платежи |
| `wants` | Гибкие расходы | Кафе, развлечения, шопинг, подписки |
| `savings` | Накопления и цели | Вклад, инвестиции, цели, досрочное погашение |

### 2.3 Базовые правила классификации
- Минимальный обязательный платёж по кредиту → `needs`
- Досрочное погашение долга → `savings`
- Перевод на вклад / накопительный счёт / цель → `savings`
- Аренда, ЖКХ, продукты, базовый транспорт → `needs`
- Кафе, маркетплейсы, развлечения, необязательные подписки → `wants`

### 2.4 Режимы работы
- `personal`
- `household`

### 2.5 Типы периода
- `monthly`
- `weekly`
- `salary_cycle` — для пользователей с доходом частями

---

## 3. Шаблоны бюджета

### 3.1 Системные шаблоны

| Код | Название | Needs | Wants | Savings | Для кого |
|---|---|---:|---:|---:|---|
| `classic_50_30_20` | Классический 50/30/20 | 50% | 30% | 20% | Базовый старт |
| `cis_realistic_60_20_20` | Реалистичный для СНГ | 60% | 20% | 20% | Высокая аренда, семья |
| `anti_crisis_70_20_10` | Антикризисный | 70% | 20% | 10% | Нестабильный доход |
| `aggressive_saving_50_20_30` | Агрессивное накопление | 50% | 20% | 30% | Крупная цель, первый взнос |
| `debt_repayment_55_15_30` | Погашение долгов | 55% | 15% | 30% | Активное закрытие долгов |
| `salary_cycle` | Зарплата частями | configurable | configurable | configurable | Доход 2 раза в месяц |

### 3.2 Дефолт для СНГ
Шаблон по умолчанию — `cis_realistic_60_20_20`. Классический 50/30/20 доступен как международный пресет.

### 3.3 Кастомные шаблоны
Пользователь может:
- изменить проценты
- сохранить свой шаблон
- сделать его личным или семейным
- активировать один шаблон как основной

### 3.4 Рекомендация шаблона на онбординге
- Обязательные расходы стабильно высокие → `cis_realistic_60_20_20`
- Есть заметный свободный остаток → `classic_50_30_20`
- Активны крупные цели → `aggressive_saving_50_20_30`
- Есть долговая нагрузка → `debt_repayment_55_15_30`
- Доход приходит частями → `salary_cycle`

---

## 4. Категории и классификация

### 4.1 Дефолтный маппинг

#### Needs
- Аренда / Ипотека
- ЖКХ
- Интернет / Связь
- Продукты
- Транспорт
- Лекарства / Здоровье
- Детские базовые расходы
- Минимальные платежи по кредитам

#### Wants
- Кафе / Рестораны
- Развлечения
- Подписки
- Покупки / Маркетплейсы
- Хобби
- Путешествия
- Такси ради удобства

#### Savings
- Вклад
- Подушка безопасности
- Инвестиции
- Цели
- Досрочное погашение кредита

### 4.2 Приоритет классификации
1. Ручной override у конкретной транзакции
2. Привязка категории к bucket
3. Дефолтная привязка из шаблона
4. Fallback-правило системы

### 4.3 Пограничные случаи
- Базовая одежда ребёнку → `needs`
- Импульсная покупка одежды → `wants`
- Рабочее такси по необходимости → `needs`
- Такси для комфорта → `wants`
- Перевод на накопительный счёт → `savings`

---

## 5. Основные пользовательские сценарии

### 5.1 Онбординг фичи
Путь: `Бюджеты → Шаблоны бюджета`

1. Выбор шаблона
2. Выбор режима: personal / household
3. Выбор периода
4. Подтверждение категорий
5. Включение goals / recurring / cash tracking
6. Сохранение профиля
7. Первый расчёт бюджета

### 5.2 Основной dashboard
Пользователь должен видеть:
- 3 карточки по корзинам
- план и факт
- прогресс по каждой корзине
- safe-to-spend
- темп расходов
- ближайшие регулярные платежи
- предупреждения
- блок целей

### 5.3 Экран категорий
- Все категории и их bucket
- Смена bucket вручную
- Bulk assign
- Неразмеченные категории
- Preview пересчёта до сохранения

### 5.4 Override транзакции
В карточке транзакции пользователь может:
- увидеть текущую классификацию
- изменить bucket
- сохранить override

### 5.5 Закрытие периода
1. Пересчёт бюджета
2. Фиксация snapshot
3. Сохранение версии периода
4. Сохранение финальных статусов
5. Открытие следующего периода

---

## 6. Safe-to-spend

### 6.1 Назначение
Показывать одну понятную цифру: сколько денег можно безопасно потратить сейчас, не ломая бюджет.

### 6.2 Формула
```
safe_to_spend =
  available_cash
  - remaining_needs
  - planned_savings_remaining
  - upcoming_recurring_before_next_income
```

### 6.3 Что показывать
- `Сегодня можно безопасно потратить`
- `До следующей зарплаты можно безопасно потратить`

---

## 7. Spending pace

### 7.1 Назначение
Предиктивные сигналы о темпе расходов — понять заранее, не тратит ли пользователь слишком быстро.

### 7.2 Что считать
- Текущий темп по `wants` и `needs`
- Прогноз перерасхода
- Прогноз остатка на конец месяца
- Предполагаемая дата исчерпания свободного бюджета

### 7.3 Сигналы
| Код | Описание |
|---|---|
| `on_track` | В норме |
| `slightly_fast` | Чуть быстрее плана |
| `overspending_risk` | Риск перерасхода |
| `behind_on_savings` | Отстаём по накоплениям |

---

## 8. Recurring payments

### 8.1 Назначение
Найти регулярные списания и показать их отдельно — помочь обнаружить «тихие утечки» бюджета.

### 8.2 Что считать recurring
- Подписки
- Кредиты
- Интернет, связь
- Аренда, коммунальные
- Регулярные переводы

### 8.3 Что показывать
- Ближайшие регулярные списания
- Сумма recurring за месяц
- Потенциальная экономия

---

## 9. Goals integration

### 9.1 Назначение
Связать `savings` bucket с финансовыми целями. В Family Finance v2 уже есть `goals` и `monthly_goals` — budgeting feature использует их как готовую доменную основу.

### 9.2 Возможности
- Учитывать взносы в цель как `savings`
- Показывать рекомендуемый взнос
- Прогнозировать дату достижения цели
- Предлагать перевести свободный остаток в цель

---

## 10. Household review

### 10.1 Назначение
Weekly review для семьи. Так как продукт household-first, обзор бюджета семьи — логичное расширение существующей household access model.

### 10.2 Что должно быть в review
- Краткое резюме недели
- Категории с ростом расходов
- Recurring, которые стоит проверить
- Общий safe-to-spend
- 1–3 следующие рекомендации

---

## 11. Формулы расчёта

### 11.1 Базовые
```
net_income     = сумма доходов за период
needs_target   = net_income × needs_percent / 100
wants_target   = net_income × wants_percent / 100
savings_target = net_income × savings_percent / 100
```

### 11.2 Actual
```
needs_actual   = расходы needs + мин. обязательные платежи по долгам
wants_actual   = расходы wants
savings_actual = переводы в накопления + инвестиции + взносы в цели + досрочные платежи
```

### 11.3 Прогресс
```
needs_progress   = needs_actual   / needs_target   × 100
wants_progress   = wants_actual   / wants_target   × 100
savings_progress = savings_actual / savings_target × 100
```

### 11.4 Expected-to-date
```
elapsed_ratio             = elapsed_days / total_days
expected_needs_to_date    = needs_target   × elapsed_ratio
expected_wants_to_date    = wants_target   × elapsed_ratio
expected_savings_to_date  = savings_target × elapsed_ratio
```

### 11.5 Статусы

Для `needs` и `wants`:
| Код | Условие |
|---|---|
| `ok` | ниже warning threshold |
| `warning` | 90–100% лимита |
| `exceeded` | лимит превышен |

Для `savings`:
| Код | Условие |
|---|---|
| `below_target` | сильно ниже цели |
| `warning` | немного ниже цели |
| `ok` | идёт по плану |

---

## 12. Сущности БД

### 12.1 `budget_templates`
```sql
id                   uuid          pk
code                 text          unique not null
household_id         uuid          null
created_by           uuid          null
name_ru              text          not null
name_en              text          not null
description_ru       text          not null
description_en       text          not null
needs_percent        numeric(5,2)  not null
wants_percent        numeric(5,2)  not null
savings_percent      numeric(5,2)  not null
period_type          text          not null default 'monthly'
budget_mode          text          not null default 'household'
base_currency        char(3)       not null default 'RUB'
is_system            boolean       not null default false
is_cis_recommended   boolean       not null default false
sort_order           int           not null default 100
is_active            boolean       not null default true
created_at           timestamptz   not null default now()
updated_at           timestamptz   not null default now()
```

### 12.2 `budget_template_category_defaults`
```sql
id                    uuid  pk
template_id           uuid  not null
system_category_code  text  not null
bucket_code           text  not null
priority              int   not null default 100
```

### 12.3 `budget_rule_profiles`
```sql
id                              uuid          pk
household_id                    uuid          not null
owner_user_id                   uuid          not null
template_id                     uuid          null
name                            text          not null
method                          text          not null default 'template_based'
needs_percent                   numeric(5,2)  not null
wants_percent                   numeric(5,2)  not null
savings_percent                 numeric(5,2)  not null
period_type                     text          not null default 'monthly'
budget_mode                     text          not null default 'household'
base_currency                   char(3)       not null default 'RUB'
rounding_mode                   text          not null default 'nearest_100'
needs_warning_threshold         numeric(5,2)  not null default 90
wants_warning_threshold         numeric(5,2)  not null default 90
savings_warning_threshold       numeric(5,2)  not null default 75
include_goal_contributions      boolean       not null default true
include_extra_debt_payments     boolean       not null default true
include_transfers_to_savings    boolean       not null default true
safe_to_spend_enabled           boolean       not null default true
spending_pace_enabled           boolean       not null default true
recurring_audit_enabled         boolean       not null default true
household_review_enabled        boolean       not null default true
is_active                       boolean       not null default true
created_at                      timestamptz   not null default now()
updated_at                      timestamptz   not null default now()
```

### 12.4 `budget_buckets`
```sql
id              uuid  pk
code            text  unique not null  -- needs | wants | savings
name_ru         text  not null
name_en         text  not null
description_ru  text  null
description_en  text  null
sort_order      int   not null default 100
is_active       boolean not null default true
```

### 12.5 `category_bucket_map`
```sql
id            uuid  pk
profile_id    uuid  not null
category_id   uuid  not null
bucket_code   text  not null
source        text  not null  -- template_default | user_defined | system_fallback
created_at    timestamptz not null default now()
updated_at    timestamptz not null default now()
unique (profile_id, category_id)
```

### 12.6 `transaction_budget_classifications`
```sql
id               uuid          pk
profile_id       uuid          not null
transaction_id   uuid          not null
bucket_code      text          not null
source           text          not null  -- category_map | user_override | fallback
is_override      boolean       not null default false
classified_at    timestamptz   not null default now()
unique (profile_id, transaction_id)
```

### 12.7 `budget_period_snapshots`
```sql
id                uuid          pk
profile_id        uuid          not null
period_start      date          not null
period_end        date          not null
period_type       text          not null
net_income        numeric(16,2) not null
needs_target      numeric(16,2) not null
wants_target      numeric(16,2) not null
savings_target    numeric(16,2) not null
needs_actual      numeric(16,2) not null
wants_actual      numeric(16,2) not null
savings_actual    numeric(16,2) not null
needs_ratio       numeric(7,4)  not null
wants_ratio       numeric(7,4)  not null
savings_ratio     numeric(7,4)  not null
needs_status      text          not null
wants_status      text          not null
savings_status    text          not null
snapshot_type     text          not null  -- interim | final
closed_at         timestamptz   null
created_at        timestamptz   not null default now()
unique (profile_id, period_start, snapshot_type)
```

### 12.8 `budget_alert_events`
```sql
id            uuid          pk
profile_id    uuid          not null
household_id  uuid          not null
alert_type    text          not null
bucket_code   text          null
payload       jsonb         null
is_read       boolean       not null default false
read_at       timestamptz   null
created_at    timestamptz   not null default now()
```

Alert types:
- `threshold_reached`
- `bucket_exceeded`
- `savings_lagging`
- `income_drop`
- `uncategorized_expenses_present`
- `upcoming_recurring_cluster`
- `pace_off_track`
- `goal_falling_behind`

### 12.9 `budget_recurring_patterns`
```sql
id                  uuid          pk
profile_id          uuid          not null
household_id        uuid          not null
merchant_normalized text          not null
category_id         uuid          null
bucket_code         text          null
frequency           text          not null  -- monthly | weekly | quarterly
avg_amount          numeric(16,2) not null
last_seen_at        date          not null
next_predicted_at   date          null
confidence          numeric(5,4)  not null
is_confirmed        boolean       not null default false
is_subscription     boolean       not null default false
created_at          timestamptz   not null default now()
updated_at          timestamptz   not null default now()
```

### 12.10 `budget_goal_allocations`
```sql
id                  uuid          pk
profile_id          uuid          not null
goal_id             uuid          not null
allocation_percent  numeric(5,2)  not null
is_active           boolean       not null default true
created_at          timestamptz   not null default now()
updated_at          timestamptz   not null default now()
unique (profile_id, goal_id)
```

### 12.11 `budget_household_reviews`
```sql
id             uuid        pk
household_id   uuid        not null
profile_id     uuid        not null
week_start     date        not null
week_end       date        not null
summary_json   jsonb       not null
status         text        not null default 'open'  -- open | closed
closed_at      timestamptz null
created_at     timestamptz not null default now()
unique (profile_id, week_start)
```

---

## 13. GitHub Epic & Issues

### Epic
**Smart Budgeting / Budget Templates module for Family Finance v2**

Labels: `epic` `budgeting` `family-finance-v2`

### Issues

| # | Title | Labels | Milestone |
|---|---|---|---|
| 1 | Create DB schema for Smart Budgeting module | `backend` `database` `migration` | M1 |
| 2 | Add RLS policies for Smart Budgeting tables | `backend` `security` `rls` | M1 |
| 3 | Seed system budget templates and default bucket mappings | `backend` `seed` | M1 |
| 4 | Implement budget profile creation flow from template | `frontend` `backend` `wizard` | M1 |
| 5 | Implement category-to-bucket mapping management | `frontend` `backend` `categories` | M2 |
| 6 | Implement transaction budget classification and override | `backend` `frontend` `transactions` | M2 |
| 7 | Build budget summary engine and period snapshots | `backend` `api` `analytics` | M2 |
| 8 | Build budget dashboard UI | `frontend` `dashboard` `ux` | M2 |
| 9 | Implement safe-to-spend engine and UI | `backend` `frontend` `insights` | M3 |
| 10 | Implement spending pace and overspend forecasting | `backend` `frontend` `forecasting` | M3 |
| 11 | Implement recurring payment detection and upcoming bills screen | `backend` `frontend` `recurring` | M4 |
| 12 | Integrate budgeting with goals and monthly goals | `backend` `frontend` `goals` | M4 |
| 13 | Implement household weekly review and budget insights | `frontend` `backend` `household` | M4 |
| 14 | Add alerts, nudges, and budget status notifications | `backend` `frontend` `notifications` | M3 |
| 15 | Add RU/EN localization for Smart Budgeting module | `frontend` `i18n` | M5 |
| 16 | QA, edge cases, and release readiness for Smart Budgeting module | `qa` `release` | M5 |

### Milestones
- **M1 — Foundation**: DB schema, RLS, seed, profile setup
- **M2 — Core budgeting**: Category mapping, classification, summary engine, dashboard
- **M3 — Smart insights**: Safe-to-spend, pace, alerts, goals integration
- **M4 — Household intelligence**: Recurring audit, upcoming bills, household review
- **M5 — Polish and release**: Localization, QA, edge cases, rollout prep

---

## 14. Ограничения и адаптация

Правило 50/30/20 не универсально. В дорогих городах и при высокой доле фиксированных платежей needs могут стабильно выходить за 50%. Поэтому важно поддерживать кастомные варианты: 60/20/20 или 55/25/20.

Wants лучше трактовать как **верхний предел**, а savings — как **целевой минимум**.

Если доход в месяце нулевой или неполный — правило временно отключать и показывать «недостаточно данных для оценки».

---

*Документ подготовлен для Family Finance v2 · Bagirov24/family-finance-v2*
