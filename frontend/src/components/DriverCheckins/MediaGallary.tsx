type Props = {
  title: string;
  images?: string[];
};

export default function MediaGallery({ title, images }: Props) {
  if (!images?.length) return null;

  return (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={title}
            className="rounded border object-cover h-32 w-full"
          />
        ))}
      </div>
    </div>
  );
}
