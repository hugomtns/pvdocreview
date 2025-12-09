import { Circle, Square } from 'lucide-react';
import type { ShapeType } from '@/types';
import './DrawingToolbar.css';

interface DrawingToolbarProps {
  isDrawingMode: boolean;
  selectedShape: ShapeType;
  selectedColor: string;
  strokeWidth: number;
  onToggleDrawingMode: () => void;
  onShapeChange: (shape: ShapeType) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
}

const PRESET_COLORS = [
  { value: '#FF0000', label: 'Red' },
  { value: '#00FF00', label: 'Green' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#FF00FF', label: 'Magenta' },
  { value: '#00FFFF', label: 'Cyan' },
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
];

const STROKE_WIDTHS = [1, 2, 3, 4, 5];

export function DrawingToolbar({
  isDrawingMode,
  selectedShape,
  selectedColor,
  strokeWidth,
  onToggleDrawingMode,
  onShapeChange,
  onColorChange,
  onStrokeWidthChange,
}: DrawingToolbarProps) {
  return (
    <div className="drawing-toolbar">
      <button
        className={`drawing-toolbar__toggle ${isDrawingMode ? 'drawing-toolbar__toggle--active' : ''}`}
        onClick={onToggleDrawingMode}
        title={isDrawingMode ? 'Disable drawing mode' : 'Enable drawing mode'}
      >
        {isDrawingMode ? '✓ Drawing Mode' : '+ Drawing Mode'}
      </button>

      {isDrawingMode && (
        <>
          <div className="drawing-toolbar__divider" />

          {/* Shape Selector */}
          <div className="drawing-toolbar__section">
            <span className="drawing-toolbar__label">Shape:</span>
            <div className="drawing-toolbar__button-group">
              <button
                className={`drawing-toolbar__shape-button ${selectedShape === 'rectangle' ? 'drawing-toolbar__shape-button--active' : ''}`}
                onClick={() => onShapeChange('rectangle')}
                title="Rectangle (R)"
              >
                <Square size={18} />
              </button>
              <button
                className={`drawing-toolbar__shape-button ${selectedShape === 'circle' ? 'drawing-toolbar__shape-button--active' : ''}`}
                onClick={() => onShapeChange('circle')}
                title="Circle (C)"
              >
                <Circle size={18} />
              </button>
            </div>
          </div>

          <div className="drawing-toolbar__divider" />

          {/* Color Picker */}
          <div className="drawing-toolbar__section">
            <span className="drawing-toolbar__label">Color:</span>
            <div className="drawing-toolbar__color-grid">
              {PRESET_COLORS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`drawing-toolbar__color-swatch ${selectedColor === value ? 'drawing-toolbar__color-swatch--active' : ''}`}
                  style={{ backgroundColor: value }}
                  onClick={() => onColorChange(value)}
                  title={label}
                  aria-label={label}
                />
              ))}
            </div>
          </div>

          <div className="drawing-toolbar__divider" />

          {/* Stroke Width Selector */}
          <div className="drawing-toolbar__section">
            <span className="drawing-toolbar__label">Width:</span>
            <div className="drawing-toolbar__button-group">
              {STROKE_WIDTHS.map(width => (
                <button
                  key={width}
                  className={`drawing-toolbar__width-button ${strokeWidth === width ? 'drawing-toolbar__width-button--active' : ''}`}
                  onClick={() => onStrokeWidthChange(width)}
                  title={`${width}px`}
                >
                  {width}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
