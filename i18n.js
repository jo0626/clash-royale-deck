/* =============================================================
 *  CR Deck Builders – 多言語化(i18n)
 *  方針：HTMLは書き換えず、DOMの日本語テキスト/属性を辞書で各言語へ置換。
 *   ・UI文言は読み込み時＋言語切替時にDOM全体を1回走査。
 *   ・カード名など動的描画は #cardList / #deckSlots だけを限定監視（childListのみ＝
 *     ユーザー操作の再描画時だけ発火。毎フレームではないので軽い／落ちない）。
 *  追加言語：LANGS と DICT に足すだけ。RTL(ar/fa)は dir=rtl を自動設定。
 * ============================================================= */
(function () {
  const LANGS = ['ja', 'en', 'es', 'pt-br', 'fr', 'de', 'ru', 'ko', 'zh-cn', 'ar', 'tr', 'it', 'id', 'th', 'vi', 'zh-tw', 'fa', 'nl'];
  const LANG_NAMES = { ja: '日本語', en: 'English', es: 'Español', 'pt-br': 'Português', 'zh-cn': '简体中文', fr: 'Français', de: 'Deutsch', ru: 'Русский', ko: '한국어', ar: 'العربية', tr: 'Türkçe', it: 'Italiano', id: 'Indonesia', th: 'ไทย', vi: 'Tiếng Việt', 'zh-tw': '繁體中文', fa: 'فارسی', nl: 'Nederlands' };

  // 原文(日本語) → 各言語。キーは画面に出る日本語テキスト（trimして照合）。
  const DICT = {
    en: {
      // ヘッダー / ナビ
      "クラロワデッキ作成・診断ツール": "Clash Royale Deck Builder & Analyzer",
      "デッキ作成": "Deck Builder",
      "人気デッキ・デッキ探求": "Popular Decks",
      "支援・寄付": "Support",
      "リクエスト・お問い合わせ": "Requests & Contact",
      "お気に入りを上に表示": "Show favorites first",
      "コスト順に並べ替え": "Sort by cost",
      "進化": "Evolution",
      "英雄": "Hero",
      "ヒーロー/チャンピオン": "Hero / Champion",
      "お気に入り追加": "Add to favorites",
      "お気に入り解除": "Remove from favorites",
      "クリックで外す": "Click to remove",
      "タップで使い方／長押しでスロット切替": "Tap for help / hold to switch slots",
      // ビルダー(index)
      "クリア": "Clear",
      "保存": "Save",
      "平均コスト": "Avg Elixir",
      "デッキ": "Deck",
      "デッキ分析へ": "Analyze deck",
      "人気デッキから作る": "Start from a popular deck",
      "カード名か略称で検索...": "Search cards by name…",
      "全て": "All",
      "ユニット": "Units",
      "呪文": "Spells",
      "建物": "Buildings",
      "限界突破": "Evolution",
      "ヒーロー": "Hero",
      "チャンピオン": "Champion",
      "コスト": "Cost",
      // 支援(support)
      "支援・寄付": "Support",
      "開発者にエリクサーを供給する": "Supply Elixir to the developer",
      "OFUSEで応援する": "Support via OFUSE",
      "クレジットカード / Google Pay 対応": "Credit card / Google Pay",
      "ひとことメッセージを添えて応援できる": "Cheer with a short message",
      "エリクサー供給メニュー": "Elixir Supply Menu",
      "おすすめ": "Recommended",
      "人気": "Popular",
      "開発者からのメッセージ": "A message from the developer",
      "閉じる": "Close",
      // 問い合わせ(contact)
      "種類": "Type",
      "お名前（任意）": "Name (optional)",
      "内容": "Message",
      "送信する": "Send",
      "機能リクエスト": "Feature request",
      "カード追加・修正の要望": "Card add / fix request",
      "不具合の報告": "Bug report",
      "その他・ご感想": "Other / Feedback",
      "ニックネームでOK": "A nickname is fine",
      "ご要望・ご意見をご記入ください": "Write your request or feedback",
      "SNSでも受け付けています": "Also available on social media",
      // アカウント
      "🔑 ログイン": "🔑 Sign in",
      "ログアウト": "Sign out",
      "✨ ドラッグの軌跡": "✨ Drag trail"
    },
    es: {
      "クラロワデッキ作成・診断ツール": "Creador y analizador de mazos de Clash Royale",
      "デッキ作成": "Crear mazo", "人気デッキ・デッキ探求": "Mazos populares", "支援・寄付": "Apoyar", "リクエスト・お問い合わせ": "Sugerencias y contacto",
      "お気に入りを上に表示": "Mostrar favoritos primero", "コスト順に並べ替え": "Ordenar por coste", "進化": "Evolución", "英雄": "Héroe", "ヒーロー/チャンピオン": "Héroe / Campeón",
      "お気に入り追加": "Añadir a favoritos", "お気に入り解除": "Quitar de favoritos", "クリックで外す": "Clic para quitar", "タップで使い方／長押しでスロット切替": "Toca para ayuda / mantén para cambiar de ranura",
      "クリア": "Limpiar", "保存": "Guardar", "平均コスト": "Elixir medio", "デッキ": "Mazo", "デッキ分析へ": "Analizar mazo", "人気デッキから作る": "Empezar con un mazo popular", "カード名か略称で検索...": "Buscar cartas por nombre…",
      "全て": "Todas", "ユニット": "Tropas", "呪文": "Hechizos", "建物": "Estructuras", "限界突破": "Evolución", "ヒーロー": "Héroe", "チャンピオン": "Campeón", "コスト": "Coste",
      "開発者にエリクサーを供給する": "Dale Elixir al desarrollador", "OFUSEで応援する": "Apoyar vía OFUSE", "クレジットカード / Google Pay 対応": "Tarjeta / Google Pay", "ひとことメッセージを添えて応援できる": "Anima con un mensaje",
      "エリクサー供給メニュー": "Menú de suministro de Elixir", "おすすめ": "Recomendado", "人気": "Popular", "開発者からのメッセージ": "Mensaje del desarrollador", "閉じる": "Cerrar",
      "種類": "Tipo", "お名前（任意）": "Nombre (opcional)", "内容": "Mensaje", "送信する": "Enviar", "機能リクエスト": "Sugerencia de función", "カード追加・修正の要望": "Añadir/corregir carta", "不具合の報告": "Reportar un error", "その他・ご感想": "Otro / Comentarios",
      "ニックネームでOK": "Un apodo está bien", "ご要望・ご意見をご記入ください": "Escribe tu sugerencia o comentario", "SNSでも受け付けています": "También en redes sociales",
      "🔑 ログイン": "🔑 Iniciar sesión", "ログアウト": "Cerrar sesión", "✨ ドラッグの軌跡": "✨ Estela al arrastrar"
    },
    'pt-br': {
      "クラロワデッキ作成・診断ツール": "Criador e analisador de decks de Clash Royale",
      "デッキ作成": "Criar deck", "人気デッキ・デッキ探求": "Decks populares", "支援・寄付": "Apoiar", "リクエスト・お問い合わせ": "Sugestões e contato",
      "お気に入りを上に表示": "Mostrar favoritos primeiro", "コスト順に並べ替え": "Ordenar por custo", "進化": "Evolução", "英雄": "Herói", "ヒーロー/チャンピオン": "Herói / Campeão",
      "お気に入り追加": "Adicionar aos favoritos", "お気に入り解除": "Remover dos favoritos", "クリックで外す": "Clique para remover", "タップで使い方／長押しでスロット切替": "Toque para ajuda / segure para trocar de slot",
      "クリア": "Limpar", "保存": "Salvar", "平均コスト": "Elixir médio", "デッキ": "Deck", "デッキ分析へ": "Analisar deck", "人気デッキから作る": "Começar com um deck popular", "カード名か略称で検索...": "Buscar cartas por nome…",
      "全て": "Todas", "ユニット": "Tropas", "呪文": "Feitiços", "建物": "Construções", "限界突破": "Evolução", "ヒーロー": "Herói", "チャンピオン": "Campeão", "コスト": "Custo",
      "開発者にエリクサーを供給する": "Dê Elixir ao desenvolvedor", "OFUSEで応援する": "Apoiar via OFUSE", "クレジットカード / Google Pay 対応": "Cartão / Google Pay", "ひとことメッセージを添えて応援できる": "Apoie com uma mensagem",
      "エリクサー供給メニュー": "Menu de suprimento de Elixir", "おすすめ": "Recomendado", "人気": "Popular", "開発者からのメッセージ": "Mensagem do desenvolvedor", "閉じる": "Fechar",
      "種類": "Tipo", "お名前（任意）": "Nome (opcional)", "内容": "Mensagem", "送信する": "Enviar", "機能リクエスト": "Sugestão de recurso", "カード追加・修正の要望": "Adicionar/corrigir carta", "不具合の報告": "Reportar um bug", "その他・ご感想": "Outro / Comentários",
      "ニックネームでOK": "Um apelido serve", "ご要望・ご意見をご記入ください": "Escreva sua sugestão ou comentário", "SNSでも受け付けています": "Também nas redes sociais",
      "🔑 ログイン": "🔑 Entrar", "ログアウト": "Sair", "✨ ドラッグの軌跡": "✨ Rastro ao arrastar"
    },
    fr: {
      "クラロワデッキ作成・診断ツール": "Créateur et analyseur de decks Clash Royale",
      "デッキ作成": "Créer un deck", "人気デッキ・デッキ探求": "Decks populaires", "支援・寄付": "Soutenir", "リクエスト・お問い合わせ": "Suggestions et contact",
      "お気に入りを上に表示": "Favoris en premier", "コスト順に並べ替え": "Trier par coût", "進化": "Évolution", "英雄": "Héros", "ヒーロー/チャンピオン": "Héros / Champion",
      "お気に入り追加": "Ajouter aux favoris", "お気に入り解除": "Retirer des favoris", "クリックで外す": "Cliquer pour retirer", "タップで使い方／長押しでスロット切替": "Appuyez pour l'aide / maintenez pour changer d'emplacement",
      "クリア": "Effacer", "保存": "Enregistrer", "平均コスト": "Élixir moyen", "デッキ": "Deck", "デッキ分析へ": "Analyser le deck", "人気デッキから作る": "Partir d'un deck populaire", "カード名か略称で検索...": "Rechercher des cartes…",
      "全て": "Toutes", "ユニット": "Troupes", "呪文": "Sorts", "建物": "Bâtiments", "限界突破": "Évolution", "ヒーロー": "Héros", "チャンピオン": "Champion", "コスト": "Coût",
      "開発者にエリクサーを供給する": "Offrir de l'Élixir au développeur", "OFUSEで応援する": "Soutenir via OFUSE", "クレジットカード / Google Pay 対応": "Carte / Google Pay", "ひとことメッセージを添えて応援できる": "Encouragez avec un message",
      "エリクサー供給メニュー": "Menu d'Élixir", "おすすめ": "Recommandé", "人気": "Populaire", "開発者からのメッセージ": "Message du développeur", "閉じる": "Fermer",
      "種類": "Type", "お名前（任意）": "Nom (facultatif)", "内容": "Message", "送信する": "Envoyer", "機能リクエスト": "Demande de fonctionnalité", "カード追加・修正の要望": "Ajout/correction de carte", "不具合の報告": "Signaler un bug", "その他・ご感想": "Autre / Avis",
      "ニックネームでOK": "Un pseudo suffit", "ご要望・ご意見をご記入ください": "Écrivez votre demande ou avis", "SNSでも受け付けています": "Aussi sur les réseaux sociaux",
      "🔑 ログイン": "🔑 Connexion", "ログアウト": "Déconnexion", "✨ ドラッグの軌跡": "✨ Traînée de glissement"
    },
    de: {
      "クラロワデッキ作成・診断ツール": "Clash Royale Deck-Builder & Analyse",
      "デッキ作成": "Deck erstellen", "人気デッキ・デッキ探求": "Beliebte Decks", "支援・寄付": "Unterstützen", "リクエスト・お問い合わせ": "Feedback & Kontakt",
      "お気に入りを上に表示": "Favoriten zuerst", "コスト順に並べ替え": "Nach Kosten sortieren", "進化": "Evolution", "英雄": "Held", "ヒーロー/チャンピオン": "Held / Champion",
      "お気に入り追加": "Zu Favoriten", "お気に入り解除": "Aus Favoriten entfernen", "クリックで外す": "Zum Entfernen klicken", "タップで使い方／長押しでスロット切替": "Tippen für Hilfe / halten zum Wechseln",
      "クリア": "Leeren", "保存": "Speichern", "平均コスト": "Ø Elixier", "デッキ": "Deck", "デッキ分析へ": "Deck analysieren", "人気デッキから作る": "Mit beliebtem Deck starten", "カード名か略称で検索...": "Karten suchen…",
      "全て": "Alle", "ユニット": "Einheiten", "呪文": "Zauber", "建物": "Gebäude", "限界突破": "Evolution", "ヒーロー": "Held", "チャンピオン": "Champion", "コスト": "Kosten",
      "開発者にエリクサーを供給する": "Dem Entwickler Elixier geben", "OFUSEで応援する": "Über OFUSE unterstützen", "クレジットカード / Google Pay 対応": "Karte / Google Pay", "ひとことメッセージを添えて応援できる": "Mit einer Nachricht unterstützen",
      "エリクサー供給メニュー": "Elixier-Menü", "おすすめ": "Empfohlen", "人気": "Beliebt", "開発者からのメッセージ": "Nachricht vom Entwickler", "閉じる": "Schließen",
      "種類": "Art", "お名前（任意）": "Name (optional)", "内容": "Nachricht", "送信する": "Senden", "機能リクエスト": "Funktionswunsch", "カード追加・修正の要望": "Karte hinzufügen/korrigieren", "不具合の報告": "Fehler melden", "その他・ご感想": "Sonstiges / Feedback",
      "ニックネームでOK": "Ein Spitzname genügt", "ご要望・ご意見をご記入ください": "Schreibe deinen Wunsch oder dein Feedback", "SNSでも受け付けています": "Auch in sozialen Medien",
      "🔑 ログイン": "🔑 Anmelden", "ログアウト": "Abmelden", "✨ ドラッグの軌跡": "✨ Zieh-Spur"
    },
    ru: {
      "クラロワデッキ作成・診断ツール": "Конструктор и анализатор колод Clash Royale",
      "デッキ作成": "Создать колоду", "人気デッキ・デッキ探求": "Популярные колоды", "支援・寄付": "Поддержать", "リクエスト・お問い合わせ": "Предложения и контакты",
      "お気に入りを上に表示": "Избранное сверху", "コスト順に並べ替え": "Сортировать по стоимости", "進化": "Эволюция", "英雄": "Герой", "ヒーロー/チャンピオン": "Герой / Чемпион",
      "お気に入り追加": "В избранное", "お気に入り解除": "Убрать из избранного", "クリックで外す": "Нажмите, чтобы убрать", "タップで使い方／長押しでスロット切替": "Нажмите для справки / удерживайте для смены слота",
      "クリア": "Очистить", "保存": "Сохранить", "平均コスト": "Ср. эликсир", "デッキ": "Колода", "デッキ分析へ": "Анализ колоды", "人気デッキから作る": "Начать с популярной колоды", "カード名か略称で検索...": "Поиск карт…",
      "全て": "Все", "ユニット": "Войска", "呪文": "Заклинания", "建物": "Здания", "限界突破": "Эволюция", "ヒーロー": "Герой", "チャンピオン": "Чемпион", "コスト": "Стоимость",
      "開発者にエリクサーを供給する": "Дать эликсир разработчику", "OFUSEで応援する": "Поддержать через OFUSE", "クレジットカード / Google Pay 対応": "Карта / Google Pay", "ひとことメッセージを添えて応援できる": "Поддержите с сообщением",
      "エリクサー供給メニュー": "Меню эликсира", "おすすめ": "Рекомендуем", "人気": "Популярное", "開発者からのメッセージ": "Сообщение от разработчика", "閉じる": "Закрыть",
      "種類": "Тип", "お名前（任意）": "Имя (необязательно)", "内容": "Сообщение", "送信する": "Отправить", "機能リクエスト": "Запрос функции", "カード追加・修正の要望": "Добавить/исправить карту", "不具合の報告": "Сообщить об ошибке", "その他・ご感想": "Другое / Отзыв",
      "ニックネームでOK": "Можно ник", "ご要望・ご意見をご記入ください": "Напишите ваш запрос или отзыв", "SNSでも受け付けています": "Также в соцсетях",
      "🔑 ログイン": "🔑 Войти", "ログアウト": "Выйти", "✨ ドラッグの軌跡": "✨ След перетаскивания"
    },
    ko: {
      "クラロワデッキ作成・診断ツール": "클래시 로얄 덱 빌더 & 분석기",
      "デッキ作成": "덱 만들기", "人気デッキ・デッキ探求": "인기 덱", "支援・寄付": "후원", "リクエスト・お問い合わせ": "요청 및 문의",
      "お気に入りを上に表示": "즐겨찾기 먼저 표시", "コスト順に並べ替え": "코스트순 정렬", "進化": "진화", "英雄": "영웅", "ヒーロー/チャンピオン": "영웅 / 챔피언",
      "お気に入り追加": "즐겨찾기 추가", "お気に入り解除": "즐겨찾기 해제", "クリックで外す": "클릭하여 제거", "タップで使い方／長押しでスロット切替": "탭하여 도움말 / 길게 눌러 슬롯 전환",
      "クリア": "비우기", "保存": "저장", "平均コスト": "평균 엘릭서", "デッキ": "덱", "デッキ分析へ": "덱 분석", "人気デッキから作る": "인기 덱으로 시작", "カード名か略称で検索...": "카드 검색…",
      "全て": "전체", "ユニット": "유닛", "呪文": "마법", "建物": "건물", "限界突破": "진화", "ヒーロー": "영웅", "チャンピオン": "챔피언", "コスト": "코스트",
      "開発者にエリクサーを供給する": "개발자에게 엘릭서 보내기", "OFUSEで応援する": "OFUSE로 후원", "クレジットカード / Google Pay 対応": "카드 / Google Pay", "ひとことメッセージを添えて応援できる": "메시지와 함께 응원",
      "エリクサー供給メニュー": "엘릭서 후원 메뉴", "おすすめ": "추천", "人気": "인기", "開発者からのメッセージ": "개발자의 메시지", "閉じる": "닫기",
      "種類": "종류", "お名前（任意）": "이름 (선택)", "内容": "내용", "送信する": "보내기", "機能リクエスト": "기능 요청", "カード追加・修正の要望": "카드 추가/수정 요청", "不具合の報告": "버그 신고", "その他・ご感想": "기타 / 의견",
      "ニックネームでOK": "닉네임도 괜찮아요", "ご要望・ご意見をご記入ください": "요청이나 의견을 적어주세요", "SNSでも受け付けています": "SNS에서도 받습니다",
      "🔑 ログイン": "🔑 로그인", "ログアウト": "로그아웃", "✨ ドラッグの軌跡": "✨ 드래그 잔상"
    },
    'zh-cn': {
      "クラロワデッキ作成・診断ツール": "皇室战争卡组构建与分析工具",
      "デッキ作成": "创建卡组", "人気デッキ・デッキ探求": "热门卡组", "支援・寄付": "支持", "リクエスト・お問い合わせ": "建议与联系",
      "お気に入りを上に表示": "收藏优先显示", "コスト順に並べ替え": "按费用排序", "進化": "进化", "英雄": "英雄", "ヒーロー/チャンピオン": "英雄 / 冠军",
      "お気に入り追加": "加入收藏", "お気に入り解除": "取消收藏", "クリックで外す": "点击移除", "タップで使い方／長押しでスロット切替": "点按查看帮助／长按切换槽位",
      "クリア": "清空", "保存": "保存", "平均コスト": "平均圣水", "デッキ": "卡组", "デッキ分析へ": "分析卡组", "人気デッキから作る": "从热门卡组开始", "カード名か略称で検索...": "搜索卡牌…",
      "全て": "全部", "ユニット": "部队", "呪文": "法术", "建物": "建筑", "限界突破": "进化", "ヒーロー": "英雄", "チャンピオン": "冠军", "コスト": "费用",
      "開発者にエリクサーを供給する": "给开发者补充圣水", "OFUSEで応援する": "通过 OFUSE 支持", "クレジットカード / Google Pay 対応": "信用卡 / Google Pay", "ひとことメッセージを添えて応援できる": "留言为开发者加油",
      "エリクサー供給メニュー": "圣水补给菜单", "おすすめ": "推荐", "人気": "热门", "開発者からのメッセージ": "开发者的话", "閉じる": "关闭",
      "種類": "类型", "お名前（任意）": "名字（可选）", "内容": "内容", "送信する": "发送", "機能リクエスト": "功能建议", "カード追加・修正の要望": "卡牌添加/修正", "不具合の報告": "问题反馈", "その他・ご感想": "其他 / 反馈",
      "ニックネームでOK": "昵称即可", "ご要望・ご意見をご記入ください": "请填写你的建议或意见", "SNSでも受け付けています": "也可通过社交媒体",
      "🔑 ログイン": "🔑 登录", "ログアウト": "退出登录", "✨ ドラッグの軌跡": "✨ 拖动轨迹"
    },
    ar: {
      "クラロワデッキ作成・診断ツール": "أداة إنشاء وتحليل مجموعات كلاش رويال",
      "デッキ作成": "إنشاء مجموعة", "人気デッキ・デッキ探求": "المجموعات الشائعة", "支援・寄付": "ادعم", "リクエスト・お問い合わせ": "اقتراحات وتواصل",
      "お気に入りを上に表示": "المفضلة أولاً", "コスト順に並べ替え": "ترتيب حسب التكلفة", "進化": "تطوّر", "英雄": "بطل", "ヒーロー/チャンピオン": "بطل / بطل خارق",
      "お気に入り追加": "أضف إلى المفضلة", "お気に入り解除": "إزالة من المفضلة", "クリックで外す": "انقر للإزالة", "タップで使い方／長押しでスロット切替": "اضغط للمساعدة / اضغط مطولاً لتبديل الخانة",
      "クリア": "مسح", "保存": "حفظ", "平均コスト": "متوسط الإكسير", "デッキ": "المجموعة", "デッキ分析へ": "تحليل المجموعة", "人気デッキから作る": "ابدأ من مجموعة شائعة", "カード名か略称で検索...": "ابحث عن البطاقات…",
      "全て": "الكل", "ユニット": "الوحدات", "呪文": "التعويذات", "建物": "المباني", "限界突破": "تطوّر", "ヒーロー": "بطل", "チャンピオン": "بطل خارق", "コスト": "التكلفة",
      "開発者にエリクサーを供給する": "امنح المطور إكسير", "OFUSEで応援する": "ادعم عبر OFUSE", "クレジットカード / Google Pay 対応": "بطاقة / Google Pay", "ひとことメッセージを添えて応援できる": "ادعم برسالة قصيرة",
      "エリクサー供給メニュー": "قائمة دعم الإكسير", "おすすめ": "موصى به", "人気": "شائع", "開発者からのメッセージ": "رسالة من المطور", "閉じる": "إغلاق",
      "種類": "النوع", "お名前（任意）": "الاسم (اختياري)", "内容": "الرسالة", "送信する": "إرسال", "機能リクエスト": "طلب ميزة", "カード追加・修正の要望": "إضافة/تصحيح بطاقة", "不具合の報告": "الإبلاغ عن خطأ", "その他・ご感想": "أخرى / ملاحظات",
      "ニックネームでOK": "اللقب يكفي", "ご要望・ご意見をご記入ください": "اكتب طلبك أو ملاحظتك", "SNSでも受け付けています": "أيضاً عبر وسائل التواصل",
      "🔑 ログイン": "🔑 تسجيل الدخول", "ログアウト": "تسجيل الخروج", "✨ ドラッグの軌跡": "✨ أثر السحب"
    },
    tr: {
      "クラロワデッキ作成・診断ツール": "Clash Royale Deste Oluşturucu ve Analiz",
      "デッキ作成": "Deste oluştur", "人気デッキ・デッキ探求": "Popüler desteler", "支援・寄付": "Destek ol", "リクエスト・お問い合わせ": "Öneri ve iletişim",
      "お気に入りを上に表示": "Önce favoriler", "コスト順に並べ替え": "Maliyete göre sırala", "進化": "Evrim", "英雄": "Kahraman", "ヒーロー/チャンピオン": "Kahraman / Şampiyon",
      "お気に入り追加": "Favorilere ekle", "お気に入り解除": "Favorilerden çıkar", "クリックで外す": "Kaldırmak için tıkla", "タップで使い方／長押しでスロット切替": "Yardım için dokun / yuva değiştirmek için basılı tut",
      "クリア": "Temizle", "保存": "Kaydet", "平均コスト": "Ort. İksir", "デッキ": "Deste", "デッキ分析へ": "Desteyi analiz et", "人気デッキから作る": "Popüler desteyle başla", "カード名か略称で検索...": "Kart ara…",
      "全て": "Tümü", "ユニット": "Birlikler", "呪文": "Büyüler", "建物": "Binalar", "限界突破": "Evrim", "ヒーロー": "Kahraman", "チャンピオン": "Şampiyon", "コスト": "Maliyet",
      "開発者にエリクサーを供給する": "Geliştiriciye İksir gönder", "OFUSEで応援する": "OFUSE ile destekle", "クレジットカード / Google Pay 対応": "Kart / Google Pay", "ひとことメッセージを添えて応援できる": "Bir mesajla destekle",
      "エリクサー供給メニュー": "İksir destek menüsü", "おすすめ": "Önerilen", "人気": "Popüler", "開発者からのメッセージ": "Geliştiriciden mesaj", "閉じる": "Kapat",
      "種類": "Tür", "お名前（任意）": "İsim (isteğe bağlı)", "内容": "Mesaj", "送信する": "Gönder", "機能リクエスト": "Özellik isteği", "カード追加・修正の要望": "Kart ekle/düzelt", "不具合の報告": "Hata bildir", "その他・ご感想": "Diğer / Geri bildirim",
      "ニックネームでOK": "Takma ad yeterli", "ご要望・ご意見をご記入ください": "İstek veya görüşünü yaz", "SNSでも受け付けています": "Sosyal medyada da",
      "🔑 ログイン": "🔑 Giriş yap", "ログアウト": "Çıkış yap", "✨ ドラッグの軌跡": "✨ Sürükleme izi"
    },
    it: {
      "クラロワデッキ作成・診断ツール": "Creatore e analizzatore di mazzi Clash Royale",
      "デッキ作成": "Crea mazzo", "人気デッキ・デッキ探求": "Mazzi popolari", "支援・寄付": "Sostieni", "リクエスト・お問い合わせ": "Suggerimenti e contatti",
      "お気に入りを上に表示": "Preferiti per primi", "コスト順に並べ替え": "Ordina per costo", "進化": "Evoluzione", "英雄": "Eroe", "ヒーロー/チャンピオン": "Eroe / Campione",
      "お気に入り追加": "Aggiungi ai preferiti", "お気に入り解除": "Rimuovi dai preferiti", "クリックで外す": "Clic per rimuovere", "タップで使い方／長押しでスロット切替": "Tocca per aiuto / tieni premuto per cambiare slot",
      "クリア": "Svuota", "保存": "Salva", "平均コスト": "Elisir medio", "デッキ": "Mazzo", "デッキ分析へ": "Analizza mazzo", "人気デッキから作る": "Parti da un mazzo popolare", "カード名か略称で検索...": "Cerca carte…",
      "全て": "Tutte", "ユニット": "Truppe", "呪文": "Incantesimi", "建物": "Edifici", "限界突破": "Evoluzione", "ヒーロー": "Eroe", "チャンピオン": "Campione", "コスト": "Costo",
      "開発者にエリクサーを供給する": "Dai Elisir allo sviluppatore", "OFUSEで応援する": "Sostieni via OFUSE", "クレジットカード / Google Pay 対応": "Carta / Google Pay", "ひとことメッセージを添えて応援できる": "Sostieni con un messaggio",
      "エリクサー供給メニュー": "Menu Elisir", "おすすめ": "Consigliato", "人気": "Popolare", "開発者からのメッセージ": "Messaggio dello sviluppatore", "閉じる": "Chiudi",
      "種類": "Tipo", "お名前（任意）": "Nome (facoltativo)", "内容": "Messaggio", "送信する": "Invia", "機能リクエスト": "Richiesta funzione", "カード追加・修正の要望": "Aggiungi/correggi carta", "不具合の報告": "Segnala un bug", "その他・ご感想": "Altro / Feedback",
      "ニックネームでOK": "Va bene un nickname", "ご要望・ご意見をご記入ください": "Scrivi la tua richiesta o feedback", "SNSでも受け付けています": "Anche sui social",
      "🔑 ログイン": "🔑 Accedi", "ログアウト": "Esci", "✨ ドラッグの軌跡": "✨ Scia di trascinamento"
    },
    id: {
      "クラロワデッキ作成・診断ツール": "Pembuat & penganalisis dek Clash Royale",
      "デッキ作成": "Buat dek", "人気デッキ・デッキ探求": "Dek populer", "支援・寄付": "Dukung", "リクエスト・お問い合わせ": "Saran & kontak",
      "お気に入りを上に表示": "Favorit di atas", "コスト順に並べ替え": "Urutkan berdasarkan biaya", "進化": "Evolusi", "英雄": "Hero", "ヒーロー/チャンピオン": "Hero / Champion",
      "お気に入り追加": "Tambah ke favorit", "お気に入り解除": "Hapus dari favorit", "クリックで外す": "Klik untuk menghapus", "タップで使い方／長押しでスロット切替": "Ketuk untuk bantuan / tahan untuk ganti slot",
      "クリア": "Bersihkan", "保存": "Simpan", "平均コスト": "Rata-rata Elixir", "デッキ": "Dek", "デッキ分析へ": "Analisis dek", "人気デッキから作る": "Mulai dari dek populer", "カード名か略称で検索...": "Cari kartu…",
      "全て": "Semua", "ユニット": "Pasukan", "呪文": "Mantra", "建物": "Bangunan", "限界突破": "Evolusi", "ヒーロー": "Hero", "チャンピオン": "Champion", "コスト": "Biaya",
      "開発者にエリクサーを供給する": "Beri Elixir ke pengembang", "OFUSEで応援する": "Dukung via OFUSE", "クレジットカード / Google Pay 対応": "Kartu / Google Pay", "ひとことメッセージを添えて応援できる": "Dukung dengan pesan",
      "エリクサー供給メニュー": "Menu Elixir", "おすすめ": "Direkomendasikan", "人気": "Populer", "開発者からのメッセージ": "Pesan dari pengembang", "閉じる": "Tutup",
      "種類": "Jenis", "お名前（任意）": "Nama (opsional)", "内容": "Pesan", "送信する": "Kirim", "機能リクエスト": "Permintaan fitur", "カード追加・修正の要望": "Tambah/perbaiki kartu", "不具合の報告": "Laporkan bug", "その他・ご感想": "Lainnya / Masukan",
      "ニックネームでOK": "Nama panggilan boleh", "ご要望・ご意見をご記入ください": "Tulis permintaan atau masukanmu", "SNSでも受け付けています": "Juga di media sosial",
      "🔑 ログイン": "🔑 Masuk", "ログアウト": "Keluar", "✨ ドラッグの軌跡": "✨ Jejak seret"
    },
    th: {
      "クラロワデッキ作成・診断ツール": "เครื่องมือสร้างและวิเคราะห์เด็ค Clash Royale",
      "デッキ作成": "สร้างเด็ค", "人気デッキ・デッキ探求": "เด็คยอดนิยม", "支援・寄付": "สนับสนุน", "リクエスト・お問い合わせ": "คำขอและติดต่อ",
      "お気に入りを上に表示": "แสดงรายการโปรดก่อน", "コスト順に並べ替え": "เรียงตามค่าใช้จ่าย", "進化": "วิวัฒนาการ", "英雄": "ฮีโร่", "ヒーロー/チャンピオン": "ฮีโร่ / แชมเปียน",
      "お気に入り追加": "เพิ่มในรายการโปรด", "お気に入り解除": "นำออกจากรายการโปรด", "クリックで外す": "คลิกเพื่อนำออก", "タップで使い方／長押しでスロット切替": "แตะเพื่อดูวิธีใช้ / กดค้างเพื่อสลับช่อง",
      "クリア": "ล้าง", "保存": "บันทึก", "平均コスト": "เอลิกเซอร์เฉลี่ย", "デッキ": "เด็ค", "デッキ分析へ": "วิเคราะห์เด็ค", "人気デッキから作る": "เริ่มจากเด็คยอดนิยม", "カード名か略称で検索...": "ค้นหาการ์ด…",
      "全て": "ทั้งหมด", "ユニット": "ยูนิต", "呪文": "เวทมนตร์", "建物": "สิ่งก่อสร้าง", "限界突破": "วิวัฒนาการ", "ヒーロー": "ฮีโร่", "チャンピオン": "แชมเปียน", "コスト": "ค่าใช้จ่าย",
      "開発者にエリクサーを供給する": "มอบเอลิกเซอร์ให้ผู้พัฒนา", "OFUSEで応援する": "สนับสนุนผ่าน OFUSE", "クレジットカード / Google Pay 対応": "บัตร / Google Pay", "ひとことメッセージを添えて応援できる": "ให้กำลังใจพร้อมข้อความ",
      "エリクサー供給メニュー": "เมนูเติมเอลิกเซอร์", "おすすめ": "แนะนำ", "人気": "ยอดนิยม", "開発者からのメッセージ": "ข้อความจากผู้พัฒนา", "閉じる": "ปิด",
      "種類": "ประเภท", "お名前（任意）": "ชื่อ (ไม่บังคับ)", "内容": "ข้อความ", "送信する": "ส่ง", "機能リクエスト": "ขอฟีเจอร์", "カード追加・修正の要望": "ขอเพิ่ม/แก้ไขการ์ด", "不具合の報告": "รายงานบั๊ก", "その他・ご感想": "อื่นๆ / ความคิดเห็น",
      "ニックネームでOK": "ใช้ชื่อเล่นได้", "ご要望・ご意見をご記入ください": "เขียนคำขอหรือความคิดเห็นของคุณ", "SNSでも受け付けています": "รับทางโซเชียลด้วย",
      "🔑 ログイン": "🔑 เข้าสู่ระบบ", "ログアウト": "ออกจากระบบ", "✨ ドラッグの軌跡": "✨ รอยลาก"
    },
    vi: {
      "クラロワデッキ作成・診断ツール": "Công cụ tạo & phân tích bộ bài Clash Royale",
      "デッキ作成": "Tạo bộ bài", "人気デッキ・デッキ探求": "Bộ bài phổ biến", "支援・寄付": "Ủng hộ", "リクエスト・お問い合わせ": "Góp ý & liên hệ",
      "お気に入りを上に表示": "Hiện yêu thích trước", "コスト順に並べ替え": "Sắp theo chi phí", "進化": "Tiến hóa", "英雄": "Anh hùng", "ヒーロー/チャンピオン": "Anh hùng / Quán quân",
      "お気に入り追加": "Thêm vào yêu thích", "お気に入り解除": "Bỏ khỏi yêu thích", "クリックで外す": "Nhấp để bỏ", "タップで使い方／長押しでスロット切替": "Chạm để xem trợ giúp / giữ để đổi ô",
      "クリア": "Xóa", "保存": "Lưu", "平均コスト": "Elixir TB", "デッキ": "Bộ bài", "デッキ分析へ": "Phân tích bộ bài", "人気デッキから作る": "Bắt đầu từ bộ bài phổ biến", "カード名か略称で検索...": "Tìm thẻ bài…",
      "全て": "Tất cả", "ユニット": "Quân", "呪文": "Phép", "建物": "Công trình", "限界突破": "Tiến hóa", "ヒーロー": "Anh hùng", "チャンピオン": "Quán quân", "コスト": "Chi phí",
      "開発者にエリクサーを供給する": "Tặng Elixir cho nhà phát triển", "OFUSEで応援する": "Ủng hộ qua OFUSE", "クレジットカード / Google Pay 対応": "Thẻ / Google Pay", "ひとことメッセージを添えて応援できる": "Ủng hộ kèm lời nhắn",
      "エリクサー供給メニュー": "Menu Elixir", "おすすめ": "Đề xuất", "人気": "Phổ biến", "開発者からのメッセージ": "Lời nhắn từ nhà phát triển", "閉じる": "Đóng",
      "種類": "Loại", "お名前（任意）": "Tên (tùy chọn)", "内容": "Nội dung", "送信する": "Gửi", "機能リクエスト": "Yêu cầu tính năng", "カード追加・修正の要望": "Thêm/sửa thẻ bài", "不具合の報告": "Báo lỗi", "その他・ご感想": "Khác / Góp ý",
      "ニックネームでOK": "Biệt danh cũng được", "ご要望・ご意見をご記入ください": "Viết yêu cầu hoặc góp ý của bạn", "SNSでも受け付けています": "Cũng nhận qua mạng xã hội",
      "🔑 ログイン": "🔑 Đăng nhập", "ログアウト": "Đăng xuất", "✨ ドラッグの軌跡": "✨ Vệt kéo"
    },
    'zh-tw': {
      "クラロワデッキ作成・診断ツール": "皇室戰爭牌組構築與分析工具",
      "デッキ作成": "建立牌組", "人気デッキ・デッキ探求": "熱門牌組", "支援・寄付": "支持", "リクエスト・お問い合わせ": "建議與聯絡",
      "お気に入りを上に表示": "收藏優先顯示", "コスト順に並べ替え": "依費用排序", "進化": "進化", "英雄": "英雄", "ヒーロー/チャンピオン": "英雄 / 冠軍",
      "お気に入り追加": "加入收藏", "お気に入り解除": "取消收藏", "クリックで外す": "點擊移除", "タップで使い方／長押しでスロット切替": "點按查看說明／長按切換欄位",
      "クリア": "清空", "保存": "儲存", "平均コスト": "平均聖水", "デッキ": "牌組", "デッキ分析へ": "分析牌組", "人気デッキから作る": "從熱門牌組開始", "カード名か略称で検索...": "搜尋卡牌…",
      "全て": "全部", "ユニット": "部隊", "呪文": "法術", "建物": "建築", "限界突破": "進化", "ヒーロー": "英雄", "チャンピオン": "冠軍", "コスト": "費用",
      "開発者にエリクサーを供給する": "給開發者補充聖水", "OFUSEで応援する": "透過 OFUSE 支持", "クレジットカード / Google Pay 対応": "信用卡 / Google Pay", "ひとことメッセージを添えて応援できる": "留言為開發者加油",
      "エリクサー供給メニュー": "聖水補給選單", "おすすめ": "推薦", "人気": "熱門", "開発者からのメッセージ": "開發者的話", "閉じる": "關閉",
      "種類": "類型", "お名前（任意）": "名稱（選填）", "内容": "內容", "送信する": "送出", "機能リクエスト": "功能建議", "カード追加・修正の要望": "卡牌新增/修正", "不具合の報告": "問題回報", "その他・ご感想": "其他 / 意見",
      "ニックネームでOK": "暱稱即可", "ご要望・ご意見をご記入ください": "請填寫你的建議或意見", "SNSでも受け付けています": "也可透過社群媒體",
      "🔑 ログイン": "🔑 登入", "ログアウト": "登出", "✨ ドラッグの軌跡": "✨ 拖曳軌跡"
    },
    fa: {
      "クラロワデッキ作成・診断ツール": "ابزار ساخت و تحلیل دک کلش رویال",
      "デッキ作成": "ساخت دک", "人気デッキ・デッキ探求": "دک‌های محبوب", "支援・寄付": "حمایت", "リクエスト・お問い合わせ": "پیشنهاد و تماس",
      "お気に入りを上に表示": "ابتدا موردعلاقه‌ها", "コスト順に並べ替え": "مرتب‌سازی بر اساس هزینه", "進化": "تکامل", "英雄": "قهرمان", "ヒーロー/チャンピオン": "قهرمان / چمپیون",
      "お気に入り追加": "افزودن به موردعلاقه", "お気に入り解除": "حذف از موردعلاقه", "クリックで外す": "برای حذف کلیک کنید", "タップで使い方／長押しでスロット切替": "برای راهنما بزنید / برای تعویض خانه نگه دارید",
      "クリア": "پاک کردن", "保存": "ذخیره", "平均コスト": "میانگین اکسیر", "デッキ": "دک", "デッキ分析へ": "تحلیل دک", "人気デッキから作る": "شروع از یک دک محبوب", "カード名か略称で検索...": "جستجوی کارت…",
      "全て": "همه", "ユニット": "یگان‌ها", "呪文": "طلسم‌ها", "建物": "ساختمان‌ها", "限界突破": "تکامل", "ヒーロー": "قهرمان", "チャンピオン": "چمپیون", "コスト": "هزینه",
      "開発者にエリクサーを供給する": "به توسعه‌دهنده اکسیر بده", "OFUSEで応援する": "حمایت از طریق OFUSE", "クレジットカード / Google Pay 対応": "کارت / Google Pay", "ひとことメッセージを添えて応援できる": "با یک پیام حمایت کن",
      "エリクサー供給メニュー": "منوی اکسیر", "おすすめ": "پیشنهادی", "人気": "محبوب", "開発者からのメッセージ": "پیام از توسعه‌دهنده", "閉じる": "بستن",
      "種類": "نوع", "お名前（任意）": "نام (اختیاری)", "内容": "پیام", "送信する": "ارسال", "機能リクエスト": "درخواست قابلیت", "カード追加・修正の要望": "افزودن/اصلاح کارت", "不具合の報告": "گزارش اشکال", "その他・ご感想": "دیگر / بازخورد",
      "ニックネームでOK": "نام مستعار هم خوب است", "ご要望・ご意見をご記入ください": "درخواست یا بازخورد خود را بنویسید", "SNSでも受け付けています": "در شبکه‌های اجتماعی هم",
      "🔑 ログイン": "🔑 ورود", "ログアウト": "خروج", "✨ ドラッグの軌跡": "✨ رد کشیدن"
    },
    nl: {
      "クラロワデッキ作成・診断ツール": "Clash Royale Deck Builder & Analyse",
      "デッキ作成": "Deck maken", "人気デッキ・デッキ探求": "Populaire decks", "支援・寄付": "Steunen", "リクエスト・お問い合わせ": "Suggesties & contact",
      "お気に入りを上に表示": "Favorieten eerst", "コスト順に並べ替え": "Sorteer op kosten", "進化": "Evolutie", "英雄": "Held", "ヒーロー/チャンピオン": "Held / Kampioen",
      "お気に入り追加": "Aan favorieten toevoegen", "お気に入り解除": "Uit favorieten", "クリックで外す": "Klik om te verwijderen", "タップで使い方／長押しでスロット切替": "Tik voor hulp / houd vast om slot te wisselen",
      "クリア": "Wissen", "保存": "Opslaan", "平均コスト": "Gem. Elixer", "デッキ": "Deck", "デッキ分析へ": "Deck analyseren", "人気デッキから作る": "Begin met een populair deck", "カード名か略称で検索...": "Zoek kaarten…",
      "全て": "Alle", "ユニット": "Troepen", "呪文": "Spreuken", "建物": "Gebouwen", "限界突破": "Evolutie", "ヒーロー": "Held", "チャンピオン": "Kampioen", "コスト": "Kosten",
      "開発者にエリクサーを供給する": "Geef Elixer aan de ontwikkelaar", "OFUSEで応援する": "Steun via OFUSE", "クレジットカード / Google Pay 対応": "Kaart / Google Pay", "ひとことメッセージを添えて応援できる": "Steun met een bericht",
      "エリクサー供給メニュー": "Elixer-menu", "おすすめ": "Aanbevolen", "人気": "Populair", "開発者からのメッセージ": "Bericht van de ontwikkelaar", "閉じる": "Sluiten",
      "種類": "Type", "お名前（任意）": "Naam (optioneel)", "内容": "Bericht", "送信する": "Versturen", "機能リクエスト": "Functieverzoek", "カード追加・修正の要望": "Kaart toevoegen/corrigeren", "不具合の報告": "Bug melden", "その他・ご感想": "Overig / Feedback",
      "ニックネームでOK": "Een bijnaam mag", "ご要望・ご意見をご記入ください": "Schrijf je verzoek of feedback", "SNSでも受け付けています": "Ook via social media",
      "🔑 ログイン": "🔑 Inloggen", "ログアウト": "Uitloggen", "✨ ドラッグの軌跡": "✨ Sleepspoor"
    }
  };

  // カード名（日本語 → 公式英名）。動的描画されるので限定監視で随時置換。
  const CARD_EN = {
    "スケルトン": "Skeletons", "アイススピリット": "Ice Spirit", "ファイアスピリット": "Fire Spirit", "エレクトロスピリット": "Electro Spirit", "ヒールスピリット": "Heal Spirit",
    "ゴブリン": "Goblins", "ボンバー": "Bomber", "槍ゴブリン": "Spear Goblins", "コウモリの群れ": "Bats", "アイスゴーレム": "Ice Golem", "ウォールブレイカー": "Wall Breakers",
    "バーサーカー": "Berserker", "ザップ": "Zap", "巨大雪玉": "Giant Snowball", "ローリングバーバリアン": "Barbarian Barrel", "ローリングウッド": "The Log", "レイジ": "Rage",
    "ステルスブッシュ": "Suspicious Bush", "ゴブリンの呪い": "Goblin Curse", "ナイト": "Knight", "アーチャー": "Archers", "ガーゴイル": "Minions", "ゴブリンギャング": "Goblin Gang",
    "スケルトンバレル": "Skeleton Barrel", "ロケット砲士": "Firecracker", "メガガーゴイル": "Mega Minion", "吹き矢ゴブリン": "Dart Goblin", "エリクサーゴーレム": "Elixir Golem",
    "アイスウィザード": "Ice Wizard", "プリンセス": "Princess", "ディガー": "Miner", "スケルトン部隊": "Skeleton Army", "盾の戦士": "Guards", "アサシン ユーノ": "Bandit",
    "漁師トリトン": "Fisherman", "ロイヤルゴースト": "Royal Ghost", "矢の雨": "Arrows", "トルネード": "Tornado", "アースクエイク": "Earthquake", "ロイヤルデリバリー": "Royal Delivery",
    "ゴブリンバレル": "Goblin Barrel", "クローン": "Clone", "ヴァイン": "Vines", "ボイド": "Void", "ミラー": "Mirror", "大砲": "Cannon", "墓石": "Tombstone",
    "バルキリー": "Valkyrie", "マスケット銃士": "Musketeer", "ミニペッカ": "Mini P.E.K.K.A", "ホグライダー": "Hog Rider", "攻城バーバリアン": "Battle Ram", "スケルトンドラゴン": "Skeleton Dragons",
    "ザッピー": "Zappies", "ホバリング砲": "Flying Machine", "バトルヒーラー": "Battle Healer", "ダイナマイトゴブリン": "Goblin Demolisher", "ダークプリンス": "Dark Prince",
    "ハンター": "Hunter", "ベビードラゴン": "Baby Dragon", "エレクトロウィザード": "Electro Wizard", "インフェルノドラゴン": "Inferno Dragon", "ランバージャック": "Lumberjack",
    "マジックアーチャー": "Magic Archer", "マザーネクロマンサー": "Mother Witch", "ダークネクロ": "Night Witch", "ゴールドナイト": "Golden Knight", "スケルトンキング": "Skeleton King",
    "マイティディガー": "Mighty Miner", "フェニックス": "Phoenix", "鍛冶屋ジャイアント": "Rune Giant", "ファイアボール": "Fireball", "フリーズ": "Freeze", "ポイズン": "Poison",
    "ゴブリンの檻": "Goblin Cage", "ゴブリンドリル": "Goblin Drill", "ゴブリンの小屋": "Goblin Hut", "ボムタワー": "Bomb Tower", "テスラ": "Tesla", "迫撃砲": "Mortar", "オーブン": "Furnace",
    "バーバリアン": "Barbarians", "ガーゴイルの群れ": "Minion Horde", "ジャイアント": "Giant", "ウィザード": "Wizard", "エアバルーン": "Balloon", "ネクロマンサー": "Witch", "ボウラー": "Bowler",
    "執行人ファルチェ": "Executioner", "60式ムート": "Cannon Cart", "ロイヤルホグ": "Royal Hogs", "アウトロー": "Rascals", "ライトニングドラゴン": "Electro Dragon", "プリンス": "Prince",
    "ラムライダー": "Ram Rider", "リトルプリンス": "Little Prince", "モンク": "Monk", "ゴブリンシュタイン": "Goblinstein", "ボスアサシン": "Boss Bandit", "アーチャークイーン": "Archer Queen",
    "ゴブリンマシン": "Goblin Machine", "スケルトンラッシュ": "Graveyard", "インフェルノタワー": "Inferno Tower", "ロイヤルジャイアント": "Royal Giant", "エリートバーバリアン": "Elite Barbarians",
    "巨大スケルトン": "Giant Skeleton", "ゴブジャイアント": "Goblin Giant", "スパーキー": "Sparky", "スピリットエンプレス": "Spirit Empress", "ロケット": "Rocket", "ライトニング": "Lightning",
    "エリクサーポンプ": "Elixir Collector", "バーバリアンの小屋": "Barbarian Hut", "巨大クロスボウ": "X-Bow", "ペッカ": "P.E.K.K.A", "ラヴァハウンド": "Lava Hound", "エレクトロジャイアント": "Electro Giant",
    "メガナイト": "Mega Knight", "見習い親衛隊": "Royal Recruits", "ゴーレム": "Golem", "三銃士": "Three Musketeers"
  };
  if (DICT.en) Object.assign(DICT.en, CARD_EN);

  function pickLang() {
    try { const s = localStorage.getItem('cr_lang'); if (s && LANGS.includes(s)) return s; } catch (e) {}
    try { const u = (new URLSearchParams(location.search).get('lang') || '').toLowerCase(); if (u && LANGS.includes(u)) return u; } catch (e) {}
    const n = (navigator.language || 'ja').toLowerCase(); // 例: 'es-mx','pt-br','ja-jp'
    if (LANGS.includes(n)) return n;
    const base = n.split('-')[0];
    const map = { pt: 'pt-br', zh: 'zh-cn' }; // 地域コードを既定の用意済みへ寄せる
    const cand = map[base] || base;
    if (LANGS.includes(cand)) return cand;
    if (base === 'ja') return 'ja';
    return LANGS.includes('en') ? 'en' : 'ja'; // それ以外は英語
  }

  let lang = pickLang();
  const origText = new WeakMap();
  const RTL = { ar: 1, fa: 1 };

  function tr(src) {
    if (lang === 'ja') return src;
    const d = DICT[lang];
    if (d && d[src] != null) return d[src];
    if (DICT.en && DICT.en[src] != null) return DICT.en[src]; // 未訳は英語へフォールバック（カード名や未訳UI）
    return src;
  }

  function translateText(root) {
    if (!root) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; let nn; while ((nn = tw.nextNode())) nodes.push(nn);
    nodes.forEach(n => {
      let o = origText.get(n); if (o == null) { o = n.nodeValue; origText.set(n, o); }
      const t = (o || '').trim(); if (!t) return;
      const rep = tr(t);
      if (lang === 'ja') { if (n.nodeValue !== o) n.nodeValue = o; }
      else if (rep !== t) { n.nodeValue = o.replace(t, rep); }
    });
  }

  function translateAttrs() {
    ['title', 'placeholder', 'aria-label', 'alt'].forEach(attr => {
      document.querySelectorAll('[' + attr + ']').forEach(el => {
        if (el.closest('[data-no-i18n]')) return;
        const dk = 'i18no_' + attr.replace('-', '_');
        let o = el.dataset[dk]; if (o == null) { o = el.getAttribute(attr) || ''; el.dataset[dk] = o; }
        const t = o.trim(); if (!t) return;
        el.setAttribute(attr, lang === 'ja' ? o : tr(t));
      });
    });
  }

  function walk() {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL[lang] ? 'rtl' : 'ltr');
    translateText(document.body);
    translateAttrs();
  }

  function setLang(l) {
    if (!LANGS.includes(l)) return;
    lang = l; try { localStorage.setItem('cr_lang', l); } catch (e) {}
    walk();
  }

  // 動的描画コンテナだけを限定監視（childListのみ＝再描画時だけ。毎フレームではない）
  function observe(id) {
    const el = document.getElementById(id); if (!el) return;
    let q = false;
    const mo = new MutationObserver(() => {
      if (lang === 'ja') return;   // 日本語は何もしない＝ゼロ負荷
      if (q) return; q = true;
      requestAnimationFrame(() => { q = false; translateText(el); });
    });
    mo.observe(el, { childList: true, subtree: true });
  }

  function injectSwitcher() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('crLangSel')) return;
    const sel = document.createElement('select');
    sel.id = 'crLangSel'; sel.setAttribute('data-no-i18n', '');
    sel.setAttribute('aria-label', 'Language');
    sel.style.cssText = 'margin-left:auto;background:var(--surface2,#1e2230);color:var(--text,#e8eaf0);border:1px solid var(--border-hi,rgba(255,255,255,.15));border-radius:8px;font-size:12px;padding:4px 6px;cursor:pointer;flex:0 0 auto;max-width:34vw;';
    LANGS.forEach(l => {
      const o = document.createElement('option'); o.value = l; o.textContent = LANG_NAMES[l] || l;
      if (l === lang) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener('change', () => setLang(sel.value));
    const acct = document.getElementById('cr-account');
    if (acct && acct.parentNode === header) header.insertBefore(sel, acct);
    else header.appendChild(sel);
    if (!document.getElementById('crI18nStyle')) {
      const st = document.createElement('style'); st.id = 'crI18nStyle';
      st.textContent =
        'header{flex-wrap:nowrap !important;align-items:center !important;gap:10px}' +
        '.logo{flex:0 0 auto}' +
        '#crLangSel{flex:0 0 auto}' +
        '#cr-account{margin-left:8px;min-width:0;flex:0 1 auto}' +
        '#cr-account .cr-avatar-btn{max-width:100%;align-items:center}' +
        '#cr-account #crAvatarName{white-space:normal;line-height:1.12;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;text-align:left;max-width:14ch}';
      document.head.appendChild(st);
    }
  }

  window.CRI18N = { setLang: setLang, apply: walk, get lang() { return lang; }, langs: LANGS };

  function init() {
    injectSwitcher();
    walk();
    observe('cardList');
    observe('deckSlots');
    setTimeout(walk, 800);   // 初期描画の取りこぼし対策（1回だけ）
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
