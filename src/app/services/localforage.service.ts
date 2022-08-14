import { Injectable } from '@angular/core';
import * as localforage from 'localforage';

@Injectable({
  providedIn: 'root'
})
export class LocalforageService {

  constructor() {
    localforage.config({
      name: 'TrainingTimerStorage'
    });
  }

  get(key: string) {
    return localforage.getItem(key);
  }

  set(key: string, value: any) {
    return localforage.setItem(key, value);
  }

  remove(key: string) {
    return localforage.removeItem(key);
  }
  
}