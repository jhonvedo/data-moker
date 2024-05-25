import { faker } from '@faker-js/faker';

export const executeFunctionString = (str, customFunctions) => {
  const regex = /{{(\w+)\((.*?)\)}}/g;
  return str.replace(regex, (match, functionName, params) => {
    const args = params.split(',').map((arg) => arg.trim());
    if (customFunctions[functionName]) {
      return customFunctions[functionName](...args);
    } else if (faker[functionName]) {
      return faker[functionName](...args);
    } else {
      throw new Error(`Function ${functionName} is not defined.`);
    }
  });
};

export const generateData = (
  schema: any,
  count: number,
  customFunctions: { [key: string]: (...args: any[]) => void } = {},
): any[] => {
  const data = [];

  for (let i = 0; i < count; i++) {
    const item = {};

    for (const key in schema) {
      if (schema.hasOwnProperty(key)) {
        const value = schema[key];
        try {
          if (typeof value === 'function') {
            item[key] = value(faker);
          } else if (
            typeof value === 'object' &&
            value.function &&
            customFunctions[value.function]
          ) {
            item[key] = customFunctions[value.function](...value.params);
          } else if (
            typeof value === 'string' &&
            /{{\w+\(.*?\)}}/.test(value)
          ) {
            item[key] = executeFunctionString(value, customFunctions);
          } else if (typeof value === 'string') {
            item[key] = faker[value]();
          }
        } catch (error) {
          item[key] = `Error with ${value}`;
        }
      }
    }

    data.push(item);
  }
  return data;
};

export const generateDataByBatch = async (
  schema: any,
  count: number,
  customFunctions: { [key: string]: (...args: any[]) => void } = {},
  batchSize: number,
) => {
  let promises: Promise<any>[] = [];

  for (let i = 0; i < count / batchSize; i++) {
    let countBatch = (i + 1) * batchSize;
    if (countBatch > count) {
      countBatch = count - batchSize * i;
    } else {
      countBatch = batchSize;
    }
    console.time('item');
    promises.push(
      new Promise(() => generateData(schema, countBatch, customFunctions)),
    );
    console.timeEnd('item');
  }

  let responses = await Promise.all(promises);
  return responses.reduce((acc, curr) => acc.concat(curr), []);
};

const customFunctions = {
  customFloat: (min, max) => (Math.random() * (max - min) + min).toFixed(2),
  customName: (prefix) =>
    `${prefix} ${faker.person.firstName()} ${faker.person.lastName()}`,
  customCalculatedValue: (factor) => {
    const baseValue = faker.number.int({ min: 1000, max: 5000 });
    return baseValue * factor;
  },
  phone: () => faker.phone.number(),
};

let schema = {
  schema: {
    id: 'datatype.uuid',
    name: { function: 'customName', params: ['Dr.'] },
    email: 'internet.email',
    phone2: 'phone.number',
    address: () =>
      `${faker.location.streetAddress()}, ${faker.location.city()}`,
    phone: '+1 {{phone()}}',
    floatValue: { function: 'customFloat', params: [10.5, 20.5] },
    calculatedField: { function: 'customCalculatedValue', params: [1.1] },
  },
  count: 100000,
};

let count = 100000;

console.time('sync');
generateData(schema.schema, 1000, customFunctions);
console.timeEnd('sync');

console.time('async');
generateDataByBatch(schema.schema, count, customFunctions, 1000).then(() => {
  console.timeEnd('async');
  //console.log(res);
});
