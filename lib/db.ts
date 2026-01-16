import 'reflect-metadata';
import { DataSource } from 'typeorm';

let dataSource: DataSource | null = null;

export const getDataSource = async (): Promise<DataSource> => {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'project_db',
    ssl: process.env.DB_HOST?.includes('neon.tech') || process.env.DB_HOST?.includes('supabase') 
      ? { rejectUnauthorized: false }
      : false,
    entities: [],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 10,
      min: 2,
    },
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully');
    return dataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const closeDataSource = async (): Promise<void> => {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
    console.log('🔌 Database connection closed');
  }
};

export const getRepository = async <T>(entity: new () => T) => {
  const ds = await getDataSource();
  return ds.getRepository(entity);
};
