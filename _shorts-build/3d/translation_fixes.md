# 앱·서버 번역 수정 목록 (anbu-3d 영상 다국어 작업 중 발견, 2026-10-04)

> **2026-10-07 상태 갱신 — 이 목록의 대부분은 해결됐거나 전제가 틀렸다.** 아래 표를 그대로 믿고 작업하지 말 것.
> - 걸음수 쉼표(1번 1·2행): **해결** — 서버 `format_number`, 앱 `NumberText`(차트 눈금 포함, 10-07)
> - 활동량 콜론(3행): **해결** — `labelSeparator()`(앱 10-07)
> - 복수형 괄호(4행): **해결** — `_one` 키 분리 + 아랍어 `trAr`
> - it/pl/ru/ar 시간 표기: **전제 정정** — 약어(`h`/`godz.`/`dn.`/`ч`)는 표준이라 문법 오류가 아니다. 아랍어만 비표준 약어(س·ي·د)라 복수형으로 교체
> - zh `问安/問安`, zh-TW `連線`: **해결**(앱 재번역)
> - 2-2 아랍어 화면 방향: **오류** — 앱은 이미 RTL로 반전된다(`DefaultWidgetsLocalizations`). 빠진 것은 `flutter_localizations`(Material 위젯 문구 영어)뿐
> - ja `見守り人`: **교체 결정** — `見守る方/見守る側`, 앱 제목 `Anbu 見守り`(원어민 확인 미완). 상세 `.claude/translation_glossary.md`
> 영상 자체는 옛 문구로 렌더돼 있다 — 다시 렌더할 때만 `fixes.json`·`strings.json`을 갱신한다.


영상은 `fixes.json`의 교정본으로 만들었다. 아래는 **앱·서버 코드에 반영할 항목**이다.
반영하면 `fixes.json`의 같은 항목을 지운다(값이 두 곳에 남지 않게).

⚠️ 앱 키 **이름은 바꾸지 않는다** — averic-lab `extract_strings.py` KEYS 계약(이름 변경·삭제 시 웹 빌드 실패). 값만 고친다.

## 1. 공통 — 코드 로직

| # | 위치 | 문제 | 고칠 방향 |
|---|---|---|---|
| 1 | 서버 `services/heartbeat_service.py` `f"{steps_delta:,}"`(알림 저장) · `services/push_service.py` `push_auto_report` `f"{steps:,}"` | 걸음수를 모든 언어에서 쉼표로 묶는다. 독일어·스페인어·이탈리아어·포르투갈어·네덜란드어·터키어·베트남어·인도네시아어는 쉼표가 **소수점**이라 "6,240보"가 **6.24보**로 읽힌다 | 푸시: 받는 보호자 `locale`로 포맷(Babel `format_decimal` 등). 알림 목록: `message_params.steps`를 **정수로** 저장하고 앱이 `NumberFormat.decimalPattern(locale)`로 표시(이미 저장된 "6,240" 문자열 행은 자정에 사라지므로 이관 불필요 — 단 앱은 두 형식을 모두 받아야 한다) |
| 2 | 앱 `guardian_dashboard_page.dart` `_StepsBarChart._formatSteps` | 차트 최댓값 라벨도 쉼표 고정 | `NumberFormat.decimalPattern(Get.locale)` |
| 3 | 앱 `activityLabelFromSteps` (`'${prefix} : '`) | 콜론 앞 공백을 모든 언어에 넣는다. 프랑스어만 맞고, 영어·독일어 등은 `Activity: Active`, 일본어·중국어는 전각 `活動量：活発` | 언어별 구분자 키(예: `guardian_activity_sep`) 추가, 또는 키 하나를 `@level` 자리표시자 문장으로 |
| 4 | 앱 `guardian_checking_subjects` · `guardian_last_check_days` 등 개수 문장 | 복수형을 괄호로 처리 — `subject(s)`, `Person(en)`, `personne(s)`, `persona(s)`, `protegido(s)`, `beschermeling(en)`, `skyddsperson(er)`, `व्यक्ति(यों)`, `Tag(en)`, `jour(s)`, `día(s)`, `dia(s)`, `dag(en)`, `dag(ar)`, `giorno/i` | GetX `trPlural` 또는 `intl` `Intl.plural`로 개수별 문장. 러시아어·폴란드어·아랍어는 형태가 3~6개다 |

## 2. 언어별 — 값만 고치면 되는 것

| 언어 | 키 | 지금 | 고칠 값 | 이유 |
|---|---|---|---|---|
| it | `guardian_last_check_hours` | `Ultimo controllo: @hours ore fa` | 1일 때 `1 ora fa` (복수형 처리 필요 — 1번 4행) | "1 ore"는 문법 오류 |
| pl | `guardian_last_check_days` | `… @days dni temu` | 1일 때 `1 dzień temu` | "1 dni"는 문법 오류 |
| ru | `guardian_last_check_days` | `… @days дн назад` | `1 день назад` / `2 дня` / `5 дней` | 축약 "дн"에 마침표도 없고 격이 맞지 않는다 |
| ar | `guardian_last_check_hours` · `_days` | `منذ 1 ساعة` · `منذ 2 ساعة` · `منذ 1 يوم` | `منذ ساعة` · `منذ ساعتين`(쌍수) · `منذ يوم` | 아랍어는 1·2에 숫자를 쓰지 않고 2는 쌍수형 |
| zh-CN | `noti_auto_report_body` · `noti_caution_suspicious_body` · `noti_caution_missing_body` · `guardian_today_summary` (그 외 `问安` 쓰는 키 전부) | `问安…` | `平安确认…` / `平安信号` / `今日平安总结` | 서버 푸시·홈페이지는 `平安`인데 앱만 `问安`(어른께 문안드리다)이라 용어가 섞인다 |
| zh-TW | 위와 같은 키들 | `問安…` | `平安確認…` | 위와 같음 |

## 2-1. 확인 필요 (영상에는 앱 문구 그대로 씀)

| 언어 | 키 | 지금 | 후보 | 메모 |
|---|---|---|---|---|
| ja | `app_guardian_title` | `Anbu 見守り人` | `Anbu 見守り` | "見守り人"은 드문 말로 보이나 검색 검증 전 |
| zh-TW | `nav_connection` | `連線` | `連結` | `連線`은 "온라인 접속" 뜻이 강해 연결 관리 탭엔 `連結`이 맞아 보이나 검증 전 |

## 2-2. 아랍어 화면 방향 — 앱 구조 문제

앱에 `flutter_localizations`·`localizationsDelegates`가 없어 **아랍어에서도 화면이 좌우 반전되지 않는다**(Directionality가 LTR로 남음).
영상은 실제 앱과 같게 반전 없이 그렸다(OS 푸시 배너·엔딩은 RTL). 아랍어 사용자에게 제대로 보이려면
`pubspec.yaml`에 `flutter_localizations`, `GetMaterialApp`에 `localizationsDelegates`·`supportedLocales`를 추가하고
아이콘·여백이 반전되는지 화면별로 확인해야 한다.

## 3. 고치지 않고 둔 것 (참고)

- 태국어 `guardian_confirm_safety` `ยืนยันแล้ว`("확인됨") — 버튼 문구로는 과거형처럼 보이지만 한국어 원문 "안전확인 **완료**"와 일본어 "安全確認完了"도 같은 결이라 틀린 번역이 아니다.

- 활동량 형용사의 성(性) 일치 — 프랑스어 `Actif`·스페인어 `Activo`·러시아어 `Активен` 등은 남성형인데 엄마 카드에도 쓰인다.
  UI 상태 표기로 남성형을 기본값으로 쓰는 관행이 있어 틀렸다고 보지는 않았다. 바꾸려면 "활동량: 높음"처럼 명사 수식 표현으로.
- 한국어 `활동량 : 활동적`도 한국어 문장부호 규칙으로는 `활동량: 활동적`이 맞다. 영상 한국어판은 확정본이라 앱 표기를 유지했다.
- 서버 푸시와 앱 알림 목록의 문장 차이(예: 터키어 `Hal hatır` / `İyilik hali`, 베트남어 `Chú ý` / `Lưu ý`)는 둘 다 자연스러워 그대로 두었다.
