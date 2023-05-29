import { StrategiesComponent } from './strategies.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [StrategiesComponent],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [StrategiesComponent],
})
export class StrategiesModule {}
