import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './database.config';

const dataSource = new DataSource(
  getDataSourceOptions(process.env, { preferDirectUrl: true }),
);

export default dataSource;
