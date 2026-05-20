-- Create the chatbot_faqs table
create table if not exists chatbot_faqs (
    id bigint primary key generated always as identity,
    question text not null,
    answer text not null,
    keywords text[] not null,
    is_preset boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table chatbot_faqs enable row level security;

-- Drop policies if they exist (for safety)
drop policy if exists "Allow public read access to FAQs" on chatbot_faqs;
drop policy if exists "Allow authenticated insert to FAQs" on chatbot_faqs;
drop policy if exists "Allow authenticated update to FAQs" on chatbot_faqs;
drop policy if exists "Allow authenticated delete to FAQs" on chatbot_faqs;

-- Create policy to allow public select access
create policy "Allow public read access to FAQs"
on chatbot_faqs
for select
to public
using (true);

-- Create policies to allow authenticated users (admins) to write/modify FAQs
create policy "Allow authenticated insert to FAQs"
on chatbot_faqs
for insert
to authenticated
with check (true);

create policy "Allow authenticated update to FAQs"
on chatbot_faqs
for update
to authenticated
using (true);

create policy "Allow authenticated delete to FAQs"
on chatbot_faqs
for delete
to authenticated
using (true);

-- Clear existing data if any (for idempotency in migrations)
truncate table chatbot_faqs restart identity cascade;

-- Seed the initial FAQ data
insert into chatbot_faqs (question, answer, keywords, is_preset) values
(
    'What diet plans do you offer?',
    'We offer customized diet plans tailored to your food preferences, lifestyle, and fitness goals:
- 🏋️ **Body Transformation** (fat loss/muscle gain)
- 🥗 **Weight Loss/Gain**
- 🌸 **PCOS Management**
- 🤰 **Gestational & Postnatal Diets**
- 🩺 **Therapeutic Diets** (metabolic health)

We offer 1-month, 3-month, and 6-month durations!',
    array['plan', 'plans', 'offer', 'duration', 'months', 'regimen', 'regimens', 'program', 'programs'],
    true
),
(
    'How can I book a customized plan?',
    'You can easily select and purchase a plan on our [Checkout Page](/checkout)! 💳
Alternatively, you can chat directly with Dt. Sabah on WhatsApp to discuss your goals before booking.',
    array['book', 'booking', 'appointment', 'consult', 'consultation', 'start', 'join', 'price', 'pricing', 'cost', 'fees', 'buy', 'purchase'],
    true
),
(
    'Who is Dt. Sabah Ghare?',
    'Dt. Sabah Ghare is a Clinical Dietitian & Lifestyle Coach, certified fitness coach, and professor of nutrition. She is the founder of The Diet Cascade and has helped over 5,000+ clients across 8+ countries achieve sustainable results without starvation or unnecessary supplements!',
    array['sabah', 'ghare', 'dietitian', 'who', 'founder', 'coach', 'doctor'],
    true
),
(
    'Where are you located?',
    'We consult clients globally online! 🌐 For in-person visits, we are active in Navi Mumbai (India) and Ajman/Dubai/Sharjah (UAE). No matter where you are in the world, we can craft a plan that fits your local ingredients and schedule!',
    array['where', 'location', 'located', 'office', 'address', 'city', 'country', 'india', 'dubai', 'uae', 'sharjah', 'ajman', 'mumbai', 'navi mumbai'],
    true
),
(
    'Can you help with PCOS or Therapeutic Diets?',
    'Yes, absolutely! PCOS management and Therapeutic diets (like reversing metabolic issues, diabetes, and thyroid management) are our specialties. We focus on natural, balanced nutrition, active lifestyle adaptation, and proper sleep.',
    array['pcos', 'diabetes', 'thyroid', 'therapeutic', 'condition', 'conditions', 'disease', 'diseases', 'illness', 'health issues', 'medical', 'pregnant', 'gestational', 'postnatal'],
    false
),
(
    'Who designed this website?',
    'This website was designed and developed by Saood Ghare. You can view his work or get in touch with him through his [Developer Portfolio](https://saoodghare08.github.io/MyPortfolio/).',
    array['saood', 'developer', 'portfolio', 'designed', 'developed', 'coder', 'saoodghare'],
    false
);
