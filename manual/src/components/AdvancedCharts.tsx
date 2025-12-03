import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart, AreaChart } from 'react-native-chart-kit';
import { useTheme } from '../hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface MultiLineChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
  legend: string[];
}

interface StackedBarChartData {
  labels: string[];
  data: number[][];
  barColors: string[];
  legend: string[];
}

interface ChartProps {
  data: any;
  width?: number;
  height?: number;
  style?: any;
}

export const TrendLineChart: React.FC<ChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 220,
  style
}) => {
  const theme = useTheme();

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.colors.primary
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: theme.colors.outline + '40'
    }
  };

  return (
    <View style={style}>
      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={{
          borderRadius: 12,
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={true}
        withShadow={false}
        formatYLabel={(value) => {
          const num = parseFloat(value);
          if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
          }
          return num.toString();
        }}
      />
    </View>
  );
};

export const MultiLineChart: React.FC<{ data: MultiLineChartData } & ChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 220,
  style
}) => {
  const theme = useTheme();

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 12,
    },
    propsForBackgroundLines: {
      stroke: theme.colors.outline + '40'
    }
  };

  return (
    <View style={style}>
      <LineChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={{
          borderRadius: 12,
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={false}
        withShadow={false}
      />
    </View>
  );
};

export const CategoryPieChart: React.FC<{ data: PieChartData[] } & ChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 220,
  style
}) => {
  const theme = useTheme();

  const chartConfig = {
    color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => theme.colors.onSurface + Math.round(opacity * 255).toString(16),
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={style}>
      <PieChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute={false}
        hasLegend={true}
        style={{
          borderRadius: 12,
        }}
      />
    </View>
  );
};

export const ComparisonBarChart: React.FC<ChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 220,
  style
}) => {
  const theme = useTheme();

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 12,
    },
    propsForBackgroundLines: {
      stroke: theme.colors.outline + '40'
    },
    barPercentage: 0.7,
  };

  return (
    <View style={style}>
      <BarChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        style={{
          borderRadius: 12,
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        showValuesOnTopOfBars={true}
        fromZero={true}
        formatYLabel={(value) => {
          const num = parseFloat(value);
          if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
          }
          return num.toString();
        }}
      />
    </View>
  );
};

export const StackedBarChart: React.FC<{ data: StackedBarChartData } & ChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 220,
  style
}) => {
  const theme = useTheme();

  // Transform data for react-native-chart-kit format
  const chartData = {
    labels: data.labels,
    legend: data.legend,
    data: data.data,
    barColors: data.barColors
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 12,
    },
    propsForBackgroundLines: {
      stroke: theme.colors.outline + '40'
    }
  };

  // Note: react-native-chart-kit doesn't have built-in stacked bar charts
  // This is a placeholder that would use BarChart with custom rendering
  // In a real implementation, you might use victory-native or react-native-svg-charts

  return (
    <View style={style}>
      <BarChart
        data={{
          labels: data.labels,
          datasets: [{
            data: data.data[0] || []
          }]
        }}
        width={width}
        height={height}
        chartConfig={chartConfig}
        style={{
          borderRadius: 12,
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
    </View>
  );
};

export const AreaTrendChart: React.FC<ChartProps> = ({
  data,
  width = screenWidth - 32,
  height = 220,
  style
}) => {
  const theme = useTheme();

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "3",
      strokeWidth: "2",
      stroke: theme.colors.primary
    },
    propsForBackgroundLines: {
      stroke: theme.colors.outline + '40'
    }
  };

  return (
    <View style={style}>
      <AreaChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        style={{
          borderRadius: 12,
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withDots={false}
        withShadow={true}
        bezier
      />
    </View>
  );
};

export const SpendingVelocityChart: React.FC<{
  current: number;
  average: number;
  trend: 'accelerating' | 'decelerating' | 'stable';
} & ChartProps> = ({
  current,
  average,
  trend,
  width = screenWidth - 32,
  height = 160,
  style
}) => {
  const theme = useTheme();

  const data = {
    labels: ['Durchschnitt', 'Aktuell'],
    datasets: [{
      data: [average, current]
    }]
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      if (trend === 'accelerating') return theme.colors.error + Math.round(opacity * 255).toString(16);
      if (trend === 'decelerating') return theme.colors.success + Math.round(opacity * 255).toString(16);
      return theme.colors.primary + Math.round(opacity * 255).toString(16);
    },
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant + Math.round(opacity * 255).toString(16),
    style: {
      borderRadius: 12,
    }
  };

  return (
    <View style={style}>
      <BarChart
        data={data}
        width={width}
        height={height}
        chartConfig={chartConfig}
        style={{
          borderRadius: 12,
        }}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        showValuesOnTopOfBars={true}
        fromZero={true}
      />
    </View>
  );
};

// Chart data transformation utilities
export const ChartUtils = {
  /**
   * Transform trend data points to chart format
   */
  transformTrendData: (data: Array<{ date: string; value: number }>, labelFormatter?: (date: string) => string): ChartData => {
    const labels = data.map(point => labelFormatter ? labelFormatter(point.date) : point.date);
    const values = data.map(point => point.value);

    return {
      labels,
      datasets: [{
        data: values
      }]
    };
  },

  /**
   * Transform category analytics to pie chart format
   */
  transformCategoryData: (
    categories: Array<{ categoryName: string; totalAmount: number; color?: string; percentage: number }>,
    theme: any
  ): PieChartData[] => {
    return categories.map((category, index) => ({
      name: category.categoryName,
      population: category.totalAmount,
      color: category.color || theme.colors.primary,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12
    }));
  },

  /**
   * Transform comparison data to multi-dataset format
   */
  transformComparisonData: (
    current: Array<{ date: string; value: number }>,
    previous: Array<{ date: string; value: number }>,
    theme: any
  ): MultiLineChartData => {
    const labels = current.map(point => point.date);

    return {
      labels,
      datasets: [
        {
          data: current.map(point => point.value),
          color: (opacity = 1) => theme.colors.primary + Math.round(opacity * 255).toString(16),
          strokeWidth: 2
        },
        {
          data: previous.map(point => point.value),
          color: (opacity = 1) => theme.colors.secondary + Math.round(opacity * 255).toString(16),
          strokeWidth: 2
        }
      ],
      legend: ['Aktueller Zeitraum', 'Vorheriger Zeitraum']
    };
  },

  /**
   * Format currency values for chart labels
   */
  formatCurrency: (value: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },

  /**
   * Format date labels for charts
   */
  formatDateLabel: (dateString: string, format: 'short' | 'medium' | 'long' = 'short'): string => {
    const date = new Date(dateString);

    switch (format) {
      case 'short':
        return `${date.getDate()}.${date.getMonth() + 1}`;
      case 'medium':
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
      case 'long':
        return date.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      default:
        return dateString;
    }
  },

  /**
   * Generate color palette for multiple categories
   */
  generateColorPalette: (count: number, baseColor: string): string[] => {
    const colors = [];
    const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);

    if (hslMatch) {
      const [, h, s, l] = hslMatch;
      const baseHue = parseInt(h);

      for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * 360 / count)) % 360;
        colors.push(`hsl(${hue}, ${s}%, ${l}%)`);
      }
    } else {
      // Fallback to predefined colors
      const fallbackColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ];

      for (let i = 0; i < count; i++) {
        colors.push(fallbackColors[i % fallbackColors.length]);
      }
    }

    return colors;
  }
};
