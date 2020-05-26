import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidatorsComponent } from './validators.component';
import { ValidatorComponent } from './validator/validator.component';

@NgModule({
  declarations: [ValidatorsComponent, ValidatorComponent],
  imports: [CommonModule],
  exports: [ValidatorsComponent, ValidatorComponent],
})
export class ValidatorsViewModule {}
