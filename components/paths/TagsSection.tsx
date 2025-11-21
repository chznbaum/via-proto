interface Tag {
  id: string;
  name: string;
}

interface TagsSectionProps {
  tags: Tag[];
}

export const TagsSection = ({ tags }: TagsSectionProps) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-lg font-medium">Tags</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="badge badge-ghost hover:bg-base-200">
            {tag.name}
          </div>
        ))}
      </div>
    </div>
  );
};
