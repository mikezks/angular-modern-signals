import { Component } from '@angular/core';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  template: `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Angular Signals</h2>
      </div>

      <div class="card-body">
        <p>
          The new reactive primitive.
        </p>
      </div>
    </div>
  `
})
export class HomeComponent {

}
