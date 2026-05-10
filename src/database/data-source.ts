import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './database.config';

const dataSource = new DataSource(getDataSourceOptions());

export default dataSource;
