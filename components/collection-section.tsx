import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Star, Crown, Play, Clock, ThumbsUp } from "lucide-react";

interface CollectionItem {
  id: string;
  title: string;
  cover: string;
  rating?: number;
}

interface CollectionSectionProps {
  title: string;
  icon: React.ReactNode;
  items: CollectionItem[];
  onAddItem: () => void;
  emptyMessage: string;
  emptyIcon: React.ReactNode;
  gridCols?: number;
  showRating?: boolean;
  showSpecialIcon?: boolean;
  specialIcon?: React.ReactNode;
}

export function CollectionSection({
  title,
  icon,
  items,
  onAddItem,
  emptyMessage,
  emptyIcon,
  gridCols = 5,
  showRating = false,
  showSpecialIcon = false,
  specialIcon,
}: CollectionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          <Button size="sm" variant="outline" onClick={onAddItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-${gridCols} gap-4`}>
          {items.map((item) => (
            <div key={item.id} className="text-center">
              <div className="aspect-[2/3] bg-muted rounded-lg mb-2 relative overflow-hidden">
                <Image
                  src={item.cover}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-xs font-medium truncate">{item.title}</p>
              {showRating && item.rating && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{item.rating.toFixed(1)}</span>
                </div>
              )}
              {showSpecialIcon && specialIcon && (
                <div className="flex items-center justify-center mt-1">
                  {specialIcon}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div
              className={`col-span-${gridCols} text-center py-8 text-muted-foreground`}
            >
              {emptyIcon}
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
