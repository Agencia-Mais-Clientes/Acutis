-- ============================================
-- Script de Importação de Lead Tracking
-- Owner: 5514996110388 (Academia Nova Ourinhos)
-- Fonte: Planilha de Rastreamento
-- ============================================

-- Limpa dados existentes para este owner (opcional - descomente se quiser)
-- DELETE FROM lead_tracking WHERE owner = '5514996110388';

-- Inserção dos leads de tráfego pago (Instagram e Facebook)
INSERT INTO lead_tracking (chatid, owner, origem, source_app, primeira_mensagem, detected_at)
VALUES
-- Instagram Ads
('5514998471933@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Boa tarde! Tudo bem? Gostaria de saber quais planos vocês teriam? E como funciona?', '2025-11-03 13:50:44'),
('5514981355398@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-03 19:31:18'),
('5514996396537@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 do 1 Mês grátis e quero mais informações', '2025-11-04 16:13:28'),
('5514998723477@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 06:21:54'),
('5514996350620@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 08:53:55'),
('5514996106539@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 10:03:26'),
('5514998339019@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-19 16:24:47'),
('5514998672217@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-04 10:50:08'),
('5514997300285@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-05 10:01:30'),
('5514998119209@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá boa tarde Gostaria de duas informações...', '2025-11-05 14:20:40'),
('5514991995062@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 08:00:10'),
('5514988281290@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 08:42:52'),
('5514991059467@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 09:10:34'),
('5514998405877@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 09:27:12'),
('5514996856838@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 10:53:16'),
('5514998591694@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 13:26:40'),
('5514998920501@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-07 10:46:53'),
('5514996269729@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-07 15:29:35'),
('5514981574111@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-07 19:03:10'),
('5514996593223@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-08 08:15:53'),
('5514998296147@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá! Abre aos domingos?', '2025-11-08 13:19:26'),
('5514998038519@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Muy Tay vcs já tem nesse horário', '2025-11-08 15:04:33'),
('5514996041269@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o muay thai', '2025-11-08 17:34:14'),
('554391781945@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio de Oferta da Unidade 02 e quero mais informações', '2025-12-17 21:32:37'),
('5514997899817@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 09:14:57'),
('5514998832629@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-09 11:49:19'),
('5514997394283@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 15:41:20'),
('5511972823046@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-09 18:49:47'),
('5514996901986@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2026-01-05 18:48:19'),
('5514996877202@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-13 08:32:17'),
('5514982269705@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-13 08:49:19'),
('5514996336199@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-13 09:21:16'),
('5514997793029@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Boa tarde, ontem fiz a primeira aula e já paguei a mensalidade...', '2025-11-13 17:58:17'),
('5514997843774@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-14 14:27:57'),
('5514997864394@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-15 08:26:11'),
('5514981727345@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-15 08:46:42'),
('5514998243212@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-15 15:33:07'),
('5514998170652@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-16 10:15:43'),
('554195437064@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-16 17:13:45'),
('5514996082251@s.whatsapp.net', '5514996110388', 'instagram_ads', 'instagram', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-16 20:10:56'),

-- Facebook Ads
('5514999048725@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-03 15:43:57'),
('5514981162400@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-03 20:44:45'),
('5514997867829@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 08:45:27'),
('554398653700@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Bom diaaaa, sou aluna da unidade 1 e Gostaria de fazer a aula experimental de HIT DANCE', '2025-11-04 09:48:34'),
('5514996016243@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-04 11:10:57'),
('5514998439166@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 13:54:44'),
('5514997026948@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 16:23:41'),
('5514997289432@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 16:34:03'),
('5514996980760@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-04 22:03:52'),
('5514997574299@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'ola', '2025-11-05 00:11:21'),
('5514997464845@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-05 08:57:31'),
('5514997979315@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-05 18:14:32'),
('5514998408400@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-05 19:04:41'),
('5514996076111@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 09:27:12'),
('5514981150860@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 11:52:03'),
('5514996722402@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 16:22:07'),
('5514996651019@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-06 18:05:43'),
('5514981726449@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-06 22:18:14'),
('5514996460403@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-07 11:25:58'),
('5514997758324@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-08 09:11:40'),
('5514981203718@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-08 11:01:12'),
('5514997925307@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-08 12:45:52'),
('554391038849@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero agendar a aula experimental de fit dance', '2025-11-08 16:18:51'),
('5514998041070@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-08 19:24:00'),
('5514996135889@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-09 09:12:57'),
('5514998226004@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 09:19:37'),
('5514996832028@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 09:26:10'),
('5514996960551@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 10:55:22'),
('5514998698300@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 13:41:51'),
('5514998847991@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 13:51:01'),
('5514996532766@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-09 14:51:55'),
('5511930427304@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-09 16:16:34'),
('5514997030833@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-09 22:08:53'),
('5514981031331@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-10 06:55:29'),
('5519988700922@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-10 07:00:11'),
('5514996751385@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-12 13:41:42'),
('5514996941214@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-13 02:39:44'),
('5514997885952@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-26 07:21:34'),
('5514997279955@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-13 10:18:22'),
('5514997293909@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-13 15:02:16'),
('5514996710971@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-12-30 17:38:37'),
('5514996536410@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-14 10:15:08'),
('5514996892457@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-14 23:33:52'),
('5514981353534@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-15 18:08:54'),
('5514996747404@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-16 10:07:22'),
('5514998994676@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-19 21:28:03'),
('5514998223808@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-12-06 09:43:26'),
('5514996770860@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Bom dia', '2025-11-17 10:20:26'),
('5514998275961@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 da Black Friday e quero mais informações', '2025-11-17 11:09:58'),
('5514981200407@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-12-09 00:38:44'),
('5514933009093@s.whatsapp.net', '5514996110388', 'facebook_ads', 'facebook', 'Olá!Vi o anúncio da Unidade 02 sobre o Free Pass e quero mais informações', '2025-11-17 13:32:10'),

-- Google Ads
('5511912516178@s.whatsapp.net', '5514996110388', 'google_ads', 'google', 'Olá!Vim do google', '2025-11-09 15:30:27')

ON CONFLICT (chatid, owner) DO NOTHING;

-- Conferir quantidade inserida
SELECT origem, COUNT(*) as total FROM lead_tracking WHERE owner = '5514996110388' GROUP BY origem ORDER BY total DESC;
