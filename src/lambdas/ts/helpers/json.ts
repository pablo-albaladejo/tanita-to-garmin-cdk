export const filterJsonByItemDate = (json: any, startDateStr?: string, endDateStr?: string) => {
  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;
  console.log('startDate', startDate);
  console.log('endDate', endDate);
  return json.filter((item: any) => {
    if (startDate && endDate) {
      const itemDate = new Date(item.date);
      console.log('itemDate', itemDate);
      return itemDate >= startDate && itemDate <= endDate;
    } else if (startDate) {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    } else if (endDate) {
      const itemDate = new Date(item.date);
      return itemDate <= endDate;
    }
    return true;
  });
};
