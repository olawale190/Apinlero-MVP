import { jest } from '@jest/globals';

// In-memory test database
const testData = {
  products: [],
  orders: [],
  order_items: [],
  customers: [],
  whatsapp_sessions: [],
  whatsapp_message_logs: [],
  whatsapp_configs: [],
  businesses: [],
  media_files: []
};

// Mock Query Builder
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.selectColumns = '*';
    this.orderByColumn = null;
    this.orderByAsc = true;
    this.limitValue = null;
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column, value) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column, value) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column, value) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column, pattern) {
    this.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  ilike(column, pattern) {
    this.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  in(column, values) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  order(column, options = {}) {
    this.orderByColumn = column;
    this.orderByAsc = options.ascending !== false;
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  single() {
    return this.execute().then(({ data, error }) => {
      if (error) return { data: null, error };
      if (!data || data.length === 0) {
        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      }
      return { data: data[0], error: null };
    });
  }

  maybeSingle() {
    return this.execute().then(({ data, error }) => {
      if (error) return { data: null, error };
      if (!data || data.length === 0) {
        return { data: null, error: null };
      }
      return { data: data[0], error: null };
    });
  }

  insert(data) {
    const records = Array.isArray(data) ? data : [data];
    const inserted = records.map(record => ({
      id: record.id || `${this.table}_${Math.random().toString(36).substring(7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...record
    }));

    testData[this.table].push(...inserted);

    return {
      select: (columns = '*') => ({
        single: () => Promise.resolve({ data: inserted[0], error: null }),
        maybeSingle: () => Promise.resolve({ data: inserted[0], error: null })
      })
    };
  }

  update(data) {
    return this.execute().then(({ data: matchedRecords, error }) => {
      if (error) return { data: null, error };

      matchedRecords.forEach(record => {
        Object.assign(record, data, { updated_at: new Date().toISOString() });
      });

      return {
        select: () => ({
          single: () => Promise.resolve({ data: matchedRecords[0], error: null })
        })
      };
    });
  }

  delete() {
    return this.execute().then(({ data: matchedRecords, error }) => {
      if (error) return { data: null, error };

      matchedRecords.forEach(record => {
        const index = testData[this.table].indexOf(record);
        if (index > -1) {
          testData[this.table].splice(index, 1);
        }
      });

      return Promise.resolve({ data: matchedRecords, error: null });
    });
  }

  execute() {
    let results = [...testData[this.table]];

    // Apply filters
    for (const filter of this.filters) {
      if (filter.operator === 'eq') {
        results = results.filter(row => row[filter.column] === filter.value);
      } else if (filter.operator === 'neq') {
        results = results.filter(row => row[filter.column] !== filter.value);
      } else if (filter.operator === 'gt') {
        results = results.filter(row => row[filter.column] > filter.value);
      } else if (filter.operator === 'gte') {
        results = results.filter(row => row[filter.column] >= filter.value);
      } else if (filter.operator === 'lt') {
        results = results.filter(row => row[filter.column] < filter.value);
      } else if (filter.operator === 'lte') {
        results = results.filter(row => row[filter.column] <= filter.value);
      } else if (filter.operator === 'like' || filter.operator === 'ilike') {
        const pattern = filter.value.replace(/%/g, '.*');
        const regex = new RegExp(pattern, filter.operator === 'ilike' ? 'i' : '');
        results = results.filter(row => regex.test(row[filter.column]));
      } else if (filter.operator === 'in') {
        results = results.filter(row => filter.value.includes(row[filter.column]));
      }
    }

    // Apply ordering
    if (this.orderByColumn) {
      results.sort((a, b) => {
        const aVal = a[this.orderByColumn];
        const bVal = b[this.orderByColumn];
        if (aVal < bVal) return this.orderByAsc ? -1 : 1;
        if (aVal > bVal) return this.orderByAsc ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitValue) {
      results = results.slice(0, this.limitValue);
    }

    return Promise.resolve({ data: results, error: null });
  }
}

// Mock Supabase Client
export const mockSupabaseClient = {
  from: (table) => new MockQueryBuilder(table),

  storage: {
    from: (bucket) => ({
      upload: jest.fn((path, file, options) => {
        const filePath = `${bucket}/${path}`;
        return Promise.resolve({
          data: { path: filePath, id: Math.random().toString(36).substring(7) },
          error: null
        });
      }),
      download: jest.fn((path) => {
        return Promise.resolve({
          data: new Blob(['test data']),
          error: null
        });
      }),
      getPublicUrl: jest.fn((path) => {
        return {
          data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${path}` }
        };
      })
    })
  },

  auth: {
    signInWithPassword: jest.fn((credentials) => {
      return Promise.resolve({
        data: {
          user: { id: 'test-user-id', email: credentials.email },
          session: { access_token: 'test-token' }
        },
        error: null
      });
    })
  }
};

// Helper functions for tests
export const seedTestData = (table, records) => {
  const dataArray = Array.isArray(records) ? records : [records];
  const processedRecords = dataArray.map(record => ({
    id: record.id || `${table}_${Math.random().toString(36).substring(7)}`,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString(),
    ...record
  }));

  // Append to existing data instead of replacing
  testData[table].push(...processedRecords);
};

export const clearTestData = (table = null) => {
  if (table) {
    testData[table] = [];
  } else {
    Object.keys(testData).forEach(key => { testData[key] = []; });
  }
};

export const getTestData = (table) => {
  return testData[table];
};

// Mock the Supabase module
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

export default mockSupabaseClient;
