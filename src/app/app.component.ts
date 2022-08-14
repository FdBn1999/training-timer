import { Component, HostListener, OnInit } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConsts } from './appConsts';
import { LocalforageService } from './services/localforage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public seconds: number;
  public isStopped: boolean;
  public settings: ITrainingSettings;

  private source = timer(0, 1000);
  private timerSubscription: Subscription;
  private step: Step;
  private currentSet: number;
  private currentExerciseNumber: number;

  constructor(
    private modalService: NgbModal,
    private localforageService: LocalforageService,
  ) {
    this.initialize();
  }

  ngOnInit(): void {
    this.getSettings();
  }

  private initialize(): void {
    this.timerSubscription = new Subscription();
    
    this.settings = {
      breakSeconds: 0,
      secondsPerExercise: 0,
      setsNumber: 0,
      exercisesNumber: 0,
      exercises: [],
    };

    this.seconds = 0;
    this.isStopped = true;
    this.step = Step.Train;
    this.currentSet = 1;
    this.currentExerciseNumber = 0;
  }

  private showDate(): void{
    this.seconds++;
    
    if (this.seconds === this.settings.secondsPerExercise && this.step === Step.Train) {
      this.step = Step.Break;
      this.initializeSeconds();
    } else if (this.seconds === this.settings.breakSeconds && this.step === Step.Break) {
      this.step = Step.Train;
      this.currentExerciseNumber++;
      this.initializeSeconds();
      if (this.currentExerciseNumber === this.settings.exercisesNumber) {
        this.currentExerciseNumber = 0;
        this.currentSet++;
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.code === AppConsts.SpaceKey && !this.isStopped) {
      this.stopTimer();
    }
    else if (event.code === AppConsts.SpaceKey && this.isStopped) {
      this.runTimer();
    }

    if (event.code === AppConsts.RLetterKey) {
      this.restartChronometer();
    }
  } 

  public runTimer(): void {
    this.isStopped = false;
    this.timerSubscription = this.source.subscribe(_ => {
      this.showDate();
    });
  }

  public stopTimer(): void {
    this.isStopped = true;
    this.timerSubscription.unsubscribe();
  }

  public initializeSeconds(): void {
    this.seconds = 0;
  }

  public openSettingsModal(content: any): void {
    this.modalService.open(content);
  }

  public closeSettingsModal(modal: any): void {
    modal.dismiss();
  }

  public closeAndSaveSettingsModal(modal: any): void {
    this.saveSettingsInLocalStorage();
    this.restartChronometer();
    modal.close();
  }

  private async saveSettingsInLocalStorage(): Promise<void> {
    this.settings.exercises = this.settings.exercises.slice(0, this.settings.exercisesNumber);
    await this.localforageService.set(AppConsts.SettingsLocalStorageKey, this.settings);
    this.getSettings();
  }

  public disablePlayBtn(): boolean {
    return this.settings.breakSeconds === 0 && this.settings.secondsPerExercise === 0;
  }

  public restartChronometer(): void {
    this.initializeSeconds();
    this.step = Step.Train;
    this.currentSet = 1;
    this.currentExerciseNumber = 0;
  }

  public getStepLabel(): string {
    if (this.settings?.exercisesNumber) {
      let label = `Set ${this.currentSet}: `;
      if (this.step === Step.Train) {
        return `${label} ${this.settings.exercises[this.currentExerciseNumber] ?? ''}`;
      } else if (this.step === Step.Break) {
        return `${label} Break`;
      } else {
        throw Error('Invalid Step');
      }
    } else {
      return '';
    }
  }

  public initializeExercisesList(): void {
    if (!this.settings.exercises || !this.settings.exercises.length) {
      this.settings.exercises = Array(this.settings.exercisesNumber).fill('');
    }
  }

  private getSettings(): void {
    this.localforageService.get(AppConsts.SettingsLocalStorageKey).then((settings: any) => {
      if (settings) {
        this.settings = settings;
      }
    });
  }
}

interface ITrainingSettings {
  secondsPerExercise: number,
  breakSeconds: number,
  setsNumber: number,
  exercisesNumber: number,
  exercises: Array<string>,
}

enum Step {
  Train,
  Break
}
