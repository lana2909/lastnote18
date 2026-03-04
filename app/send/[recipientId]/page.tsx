
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseServer } from '@/lib/supabase';
import SendMessageForm from '@/components/send/SendMessageForm';

export default async function SendMessagePage({
  params,
}: {
  params: { recipientId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const supabase = supabaseServer();
  const userClassId = session.user.classId;

  // 1. Validate Recipient
  const { data: recipient } = await supabase
    .from('users')
    .select('id, name, class_id')
    .eq('id', params.recipientId)
    .maybeSingle();

  if (!recipient || recipient.id === session.user.id) {
    redirect('/dashboard');
  }

  // Ensure recipient is in the same class (if user has a class)
  if (userClassId && recipient.class_id !== userClassId) {
    redirect('/dashboard');
  }

  // 2. Check if already submitted
  const { data: existingSubmission } = await supabase
    .from('submission_tracker')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('recipient_id', params.recipientId)
    .maybeSingle();

  if (existingSubmission) {
    redirect('/dashboard');
  }

  // 3. Fetch Classmates for Navigation (Prev/Next)
  let query = supabase
    .from('users')
    .select('id, name')
    .neq('id', session.user.id)
    .order('name');

  if (userClassId) {
    query = query.eq('class_id', userClassId);
  }

  const { data: classmates } = await query;

  // 4. Fetch list of recipients already messaged by current user
  const { data: submittedTrackers } = await supabase
    .from('submission_tracker')
    .select('recipient_id')
    .eq('user_id', session.user.id);

  const submittedRecipientIds = new Set(
    submittedTrackers?.map((t) => t.recipient_id) || []
  );

  // 5. Filter for Next/Prev logic
  const availableRecipients =
    classmates?.filter(
      (u) => !submittedRecipientIds.has(u.id) || u.id === params.recipientId
    ) || [];

  const currentIndex = availableRecipients.findIndex(
    (u) => u.id === params.recipientId
  );

  const prevRecipientId =
    currentIndex > 0 ? availableRecipients[currentIndex - 1].id : null;
  const nextRecipientId =
    currentIndex < availableRecipients.length - 1
      ? availableRecipients[currentIndex + 1].id
      : null;

  // 6. Fetch Class Questions
  let questions = [];
  if (userClassId) {
    const { data: cls } = await supabase
      .from('classes')
      .select('questions')
      .eq('id', userClassId)
      .single();
    
    if (cls && cls.questions) {
      questions = cls.questions;
    }
  }

  // Fallback to default questions if none set
  if (!questions || questions.length === 0) {
    questions = [
      { id: "kesan", label: "Berikan kesanmu tentang dia", type: "textarea", placeholder: "Tuliskan kesan yang kamu rasakan..." },
      { id: "pesan", label: "Berikan pesanmu untuk dia", type: "textarea", placeholder: "Sampaikan pesan yang ingin kamu berikan..." },
      { id: "larangan", label: "Berikan 3 atau lebih larangan yang harus dia hindari", type: "textarea", placeholder: "Tuliskan hal-hal yang sebaiknya dia hindari..." },
      { id: "sifat", label: "Berikan 3 atau lebih sifat yang harus dia pertahankan", type: "textarea", placeholder: "Tuliskan sifat-sifat baik yang harus dia jaga..." },
      { id: "kesimpulan", label: "Simpulkan dia menjadi 1 kalimat", type: "textarea", "placeholder": "Jika kamu harus menggambarkan dia dalam satu kalimat..." },
      { id: "hal_terpendam", label: "Hal yang selalu ingin kamu utarakan padanya", type: "textarea", placeholder: "Sampaikan hal yang selama ini terpendam..." },
      { id: "momen_berkesan", label: "Momen paling berkesan selama di kelas ini", type: "textarea", placeholder: "Ceritakan momen yang paling berkesan..." }
    ];
  }

  return (
    <SendMessageForm
      recipient={recipient}
      userId={session.user.id}
      prevRecipientId={prevRecipientId}
      nextRecipientId={nextRecipientId}
      availableRecipients={availableRecipients}
      questions={questions}
    />
  );
}
