-- PR Brend · seed.sql · boshlang'ich ma'lumotlar (idempotent, qayta ishga tushirish xavfsiz)
-- Arxiv kanali va jamoa guruhi ID'lari bu yerga yozilmaydi: bot kanalga admin qilinganda
-- adminlar tugma bilan biriktiradi.

begin;

insert into public.departments (slug, name_uz, default_visibility)
values ('branding', 'Branding', 'bolim')
on conflict (slug) do nothing;

-- Tur ro'yxati (hashtag). Branding boshlig'i bilan kelishilgach o'zgartirilishi mumkin.
insert into public.asset_types (slug, name_uz, requires_approval, aliases, sort_order) values
  ('taklifnoma',    'Taklifnoma',             true,  '{taklif,priglashenie,invitation,invite}', 10),
  ('banner',        'Banner',                 true,  '{baner,roll_up,rollup}',                   20),
  ('logo',          'Logo',                   true,  '{logotip,brendbuk}',                       30),
  ('prezentatsiya', 'Prezentatsiya',          true,  '{slayd,pptx,taqdimot}',                    40),
  ('smm',           'SMM',                    true,  '{post,stories,karusel}',                   50),
  ('bosma',         'Bosma maket',            true,  '{buklet,broshyura,broshura,flayer}',       60),
  ('stend',         'Stend',                  true,  '{stand,ekspozitsiya}',                     70),
  ('video',         'Video',                  true,  '{rolik,animatsiya}',                       80),
  ('boshqa',        'Boshqa',                 false, '{}',                                       90)
on conflict (slug) do nothing;

-- Sinonimlar: term = normalize() natijasi (kichik lotin, tutuq belgisiz).
insert into public.synonyms (term, canonical) values
  ('priglashenie', 'taklifnoma'),
  ('invitation',   'taklifnoma'),
  ('invite',       'taklifnoma'),
  ('taklif',       'taklifnoma'),
  ('logotip',      'logo'),
  ('slayd',        'prezentatsiya'),
  ('pptx',         'prezentatsiya'),
  ('buklet',       'bosma'),
  ('broshyura',    'bosma'),
  ('broshura',     'bosma'),
  ('stand',        'stend'),
  ('rolik',        'video'),
  ('navruz',       'navroz')
on conflict (term) do nothing;

commit;
