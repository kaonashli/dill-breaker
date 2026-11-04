// Chart colors. Charts draw SVG, which needs real color values (not CSS
// variables), so we pick the light or dark set in JavaScript.
// The series order is fixed and colorblind-checked - don't shuffle it.

const LIGHT = {
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  surface: '#ffffff',
  text: '#0b0b0b',
  text2: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  border: 'rgba(11,11,11,0.10)',
  hover: 'rgba(11,11,11,0.05)',
  // heatmap: empty, then light -> dark blue
  heat: ['#ebeae5', '#9ec5f4', '#5598e7', '#256abf', '#104281'],
  positive: '#2a78d6',
  negative: '#e34948',
}

const DARK = {
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  surface: '#1a1c1a',
  text: '#f0efec',
  text2: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
  border: 'rgba(255,255,255,0.10)',
  hover: 'rgba(255,255,255,0.06)',
  // on dark, "more" = brighter
  heat: ['#2a2c2a', '#184f95', '#256abf', '#3987e5', '#86b6ef'],
  positive: '#3987e5',
  negative: '#e66767',
}

export function chartColors(isDark) {
  return isDark ? DARK : LIGHT
}

// Shared tooltip styling for Recharts
export function tooltipProps(colors) {
  return {
    contentStyle: {
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      color: colors.text,
      fontSize: 13,
    },
    labelStyle: { color: colors.text, fontWeight: 600 },
    itemStyle: { color: colors.text },
    cursor: { fill: colors.hover },
  }
}
