interface Tag {
  id: string;
  name: string;
}

interface TagsSectionProps {
  tags: Tag[];
}

export const TagsSection = ({ tags }: TagsSectionProps) => {
  return (
    <div>
      <p className="text-lg font-medium">Tags</p>
      {tags && tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <div key={tag.id} className="badge badge-ghost hover:bg-base-200">
              {tag.name}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-base-content/75 mt-2 text-sm">No tags yet</p>
      )}
    </div>
  );
};
