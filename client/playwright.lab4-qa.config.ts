import { defineConfig } from '@playwright/test';
import config from './playwright.lab4.config.js';
// Run every preserved Labs2/3 scenario together with the Lab4 increment.
export default defineConfig({...config,testDir:'./e2e',timeout:60_000});
