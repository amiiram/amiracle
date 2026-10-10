type SectionHeadingProps = {
  label: string;
  title: string;
  kicker?: string;
  level?: 1 | 2;
};

export function SectionHeading({
  label,
  title,
  kicker,
  level = 2,
}: SectionHeadingProps) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <div className="section-heading">
      <div className="eyebrow">
        <span className="eyebrow-slash">{`//`}</span>
        <span>{label}</span>
      </div>
      <div className="section-title-wrap">
        <Heading>{title}</Heading>
        {kicker ? <span className="title-mark">✦</span> : null}
      </div>
    </div>
  );
}
