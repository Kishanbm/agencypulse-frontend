interface WidgetDataItem {
  widgetId: string;
  widgetType: string;
  data: unknown;
}

export function mapWidgetData(
  results: WidgetDataItem[]
): Record<string, WidgetDataItem> {
  return results.reduce(
    (acc, item) => {
      acc[item.widgetId] = item;
      return acc;
    },
    {} as Record<string, WidgetDataItem>
  );
}
