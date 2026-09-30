const FORM_SRC =
  "https://docs.google.com/forms/d/e/1FAIpQLSeeEoVliPu2yjFemTXbeFQizPkZYnBTie4emB7d0Wl6AZSPJA/viewform?embedded=true";

export function FeedbackForm({ title }: { title: string }) {
  return (
    <iframe
      src={FORM_SRC}
      title={title}
      className="min-h-[1500px] w-full rounded-3xl border border-line bg-card"
    >
      {title}
    </iframe>
  );
}
