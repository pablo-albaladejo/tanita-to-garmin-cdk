export const isValidCSV = (str: string) => {
  return str && !str.includes('HTML');
};
export const csvToJson = (csv: string, keys: string[]) => {
  const lines = csv.toString().split('\n');

  const json: any[] = [];

  lines.forEach((line, i) => {
    if (i > 0) {
      let jsonItem: any = {};
      const items = line.split(',');
      items.forEach((item, j) => {
        let node = undefined;
        if (j == 0 && item != '' && item.length == 21) {
          const date = new Date(item.replace(/\"/g, ''));
          node = date.toISOString();
        } else if (item !== '-') node = parseFloat(item.toString());
        jsonItem[keys[j]] = node;
      });
      json.push(jsonItem);
    }
  });

  return json;
};
