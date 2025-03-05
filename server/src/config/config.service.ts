import {Injectable} from '@nestjs/common';
import * as fs from 'fs/promises';

@Injectable()
export class ConfigService {
  static SETTINGS_FILE_NAME="settings.json"
  mapSettings:any={}
  constructor() {
  }

  onModuleInit() {
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const data = await fs.readFile(`/config/${ConfigService.SETTINGS_FILE_NAME}`, 'utf8');
      this.mapSettings = JSON.parse(data);
    } catch (err) {
      console.error('Error:', err);
    }
    return this.mapSettings;
  }

  getSettings() {
    return this.mapSettings;
  }

  getHosts() {
    return this.mapSettings.hosts;
  }
}
