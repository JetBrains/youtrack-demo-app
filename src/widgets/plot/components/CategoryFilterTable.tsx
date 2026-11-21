import type {CSSProperties} from 'react';
import {formatDuration} from 'date-fns/formatDuration';
import {contributionCategoryColour} from '../utils/colorScales.ts';
import type {CategorySummary} from '../utils/processingData.ts';

type CategoryFilterTableProps = {
    summary: CategorySummary[];
    activeCategories: Set<string>;
    onToggle: (label: string) => void;
};

const CategoryFilterTable = ({summary, activeCategories, onToggle}: CategoryFilterTableProps) => (
  <div className="category-list">
    {summary.map(({label, days, ownMinutes}) => {
            const colour = contributionCategoryColour.get(label);
            return (
              <div 
                key={label}
                className="item"
                aria-pressed={activeCategories.has(label)}
                onClick={() => onToggle(label)}
                style={{'--category-colour': colour} as CSSProperties}
              >
                <button
                  type="button"
                  disabled={days === 0}
                >
                  <span className="category-swatch"/>
                  {label}
                </button>
                <p className="numeric">{formatDuration({days: days}, {zero: true})}</p>
                <p className="numeric">{formatDuration({minutes: ownMinutes}, {zero: true})}</p>
              </div>
            );
        })}
  </div>
);

export default CategoryFilterTable;
