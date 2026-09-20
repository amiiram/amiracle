type SectionHeadingProps = {
  label: string;
  title: string;
  kicker?: string;
};

export function SectionHeading({ label, title, kicker }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div className="eyebrow">
        <span className="eyebrow-slash">{`//`}</span>
        <span>{label}</span>
      </div>
      <div className="section-title-wrap">
        <h2>{title}</h2>
        {kicker ? <span className="title-mark">✦</span> : null}
      </div>
    </div>
  );
}
