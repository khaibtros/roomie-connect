import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { FILTER_OPTIONS } from '@/constants/filterOptions';
import { cn } from '@/lib/utils';

export interface RoomFiltersState {
  areas: string[];
  priceRange: [number, number];
  sizes: string[];
  roomTypes: string[];
  regulations: string[];
  amenities: string[];
  furniture: string[];
}

interface FilterCategoryProps {
  title: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function FilterCategory({
  title,
  options,
  selected,
  onSelect,
  isOpen,
  onToggle,
}: FilterCategoryProps) {
  const [hoverOpen, setHoverOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border/50 rounded-lg hover:border-primary/50 transition-all whitespace-nowrap"
      >
        <span>{title}</span>
        {selected.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform',
            hoverOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {hoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 bg-card border border-border/50 rounded-lg shadow-lg z-50 min-w-max"
          >
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-2 cursor-pointer p-1 hover:bg-accent/50 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => onSelect(option.id)}
                    className="w-3 h-3 rounded border-border bg-card"
                  />
                  <span className="text-xs text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PriceFilterProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
}

function PriceFilter({ priceRange, onPriceChange }: PriceFilterProps) {
  const [hoverOpen, setHoverOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border/50 rounded-lg hover:border-primary/50 transition-all whitespace-nowrap"
      >
        <span>Mức Giá</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform',
            hoverOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {hoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 bg-card border border-border/50 rounded-lg shadow-lg z-50 w-64 p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {(priceRange[0] / 1000000).toFixed(1).replace(/\.0$/, '')} -
                  {' '}{(priceRange[1] / 1000000).toFixed(1).replace(/\.0$/, '')} triệu VNĐ
                </span>
              </div>
              <Slider
                value={priceRange}
                onValueChange={(value) => onPriceChange([value[0], value[1]])}
                min={1000000}
                max={10000000}
                step={100000}
                className="w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface RoomFiltersProps {
  filters: RoomFiltersState;
  onFiltersChange: (filters: RoomFiltersState) => void;
  onClear: () => void;
}

export function RoomFilters({
  filters,
  onFiltersChange,
  onClear,
}: RoomFiltersProps) {
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectOption = (
    category: keyof Omit<RoomFiltersState, 'priceRange'>,
    id: string
  ) => {
    const currentList = filters[category] as string[];
    const newList = currentList.includes(id)
      ? currentList.filter((item) => item !== id)
      : [...currentList, id];
    onFiltersChange({ ...filters, [category]: newList });
  };

  const totalFilters =
    filters.areas.length +
    filters.sizes.length +
    filters.roomTypes.length +
    filters.regulations.length +
    filters.amenities.length +
    filters.furniture.length;

  return (
    <div className="space-y-3">
      {/* Horizontal Filter Categories with Price */}
      <div className="flex gap-1.5 flex-wrap items-start">
        {/* Price Filter */}
        <PriceFilter
          priceRange={filters.priceRange}
          onPriceChange={(range) =>
            onFiltersChange({ ...filters, priceRange: range })
          }
        />

        {/* Area Filter */}
        <FilterCategory
          title="Khu Vực"
          options={FILTER_OPTIONS.areas}
          selected={filters.areas}
          onSelect={(id) => handleSelectOption('areas', id)}
          isOpen={openCategories.includes('areas')}
          onToggle={() => toggleCategory('areas')}
        />

        {/* Size Filter */}
        <FilterCategory
          title="Diện Tích"
          options={FILTER_OPTIONS.sizes}
          selected={filters.sizes}
          onSelect={(id) => handleSelectOption('sizes', id)}
          isOpen={openCategories.includes('sizes')}
          onToggle={() => toggleCategory('sizes')}
        />

        {/* Room Type Filter */}
        <FilterCategory
          title="Kiểu Phòng"
          options={FILTER_OPTIONS.roomTypes}
          selected={filters.roomTypes}
          onSelect={(id) => handleSelectOption('roomTypes', id)}
          isOpen={openCategories.includes('roomTypes')}
          onToggle={() => toggleCategory('roomTypes')}
        />

        {/* Regulations Filter */}
        <FilterCategory
          title="Quy Định"
          options={FILTER_OPTIONS.regulations}
          selected={filters.regulations}
          onSelect={(id) => handleSelectOption('regulations', id)}
          isOpen={openCategories.includes('regulations')}
          onToggle={() => toggleCategory('regulations')}
        />

        {/* Amenities Filter */}
        <FilterCategory
          title="Tiện Ích"
          options={FILTER_OPTIONS.amenities}
          selected={filters.amenities}
          onSelect={(id) => handleSelectOption('amenities', id)}
          isOpen={openCategories.includes('amenities')}
          onToggle={() => toggleCategory('amenities')}
        />

        {/* Furniture Filter */}
        <FilterCategory
          title="Nội Thất"
          options={FILTER_OPTIONS.furniture}
          selected={filters.furniture}
          onSelect={(id) => handleSelectOption('furniture', id)}
          isOpen={openCategories.includes('furniture')}
          onToggle={() => toggleCategory('furniture')}
        />
      </div>

      {/* Active Filters Display */}
      {totalFilters > 0 && (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">ĐANG LỌC:</p>
            {totalFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-xs h-7"
              >
                Xoá Tất Cả
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ...filters.areas.map((id) => ({
                id,
                label:
                  FILTER_OPTIONS.areas.find((a) => a.id === id)?.label || id,
              })),
              ...filters.sizes.map((id) => ({
                id,
                label:
                  FILTER_OPTIONS.sizes.find((a) => a.id === id)?.label || id,
              })),
              ...filters.roomTypes.map((id) => ({
                id,
                label:
                  FILTER_OPTIONS.roomTypes.find((a) => a.id === id)?.label || id,
              })),
              ...filters.regulations.map((id) => ({
                id,
                label:
                  FILTER_OPTIONS.regulations.find((a) => a.id === id)?.label ||
                  id,
              })),
              ...filters.amenities.map((id) => ({
                id,
                label:
                  FILTER_OPTIONS.amenities.find((a) => a.id === id)?.label || id,
              })),
              ...filters.furniture.map((id) => ({
                id,
                label:
                  FILTER_OPTIONS.furniture.find((a) => a.id === id)?.label || id,
              })),
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  // Determine which category this filter belongs to
                  if (filters.areas.includes(filter.id))
                    handleSelectOption('areas', filter.id);
                  else if (filters.sizes.includes(filter.id))
                    handleSelectOption('sizes', filter.id);
                  else if (filters.roomTypes.includes(filter.id))
                    handleSelectOption('roomTypes', filter.id);
                  else if (filters.regulations.includes(filter.id))
                    handleSelectOption('regulations', filter.id);
                  else if (filters.amenities.includes(filter.id))
                    handleSelectOption('amenities', filter.id);
                  else if (filters.furniture.includes(filter.id))
                    handleSelectOption('furniture', filter.id);
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {filter.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

