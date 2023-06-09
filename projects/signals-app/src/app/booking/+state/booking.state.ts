import { Store, createActionGroup, createFeature, createReducer, createSelector, emptyProps, on, props, provideState } from "@ngrx/store";
import { EnvironmentProviders, inject } from "@angular/core";
import { Actions, createEffect, ofType, provideEffects } from "@ngrx/effects";
import { switchMap, map, filter, Observable } from "rxjs";
import { FlightService } from "../flight/logic/data-access/flight.service";
import { Flight } from "../flight/logic/model/flight";
import { routerFeature } from "./router.state";

/**
 * Actions
 */

export const bookingActions = createActionGroup({
  source: 'Booking',
  events: {
    'Flights load': props<{ from: string, to: string }>(),
    'Flights loaded': props<{ flights: Flight[] }>(),
    'Flight update': props<{ flight: Flight }>(),
    'Flight save': props<{ flight: Flight }>(),
    'Flight clear': emptyProps(),
  }
});

/**
 * Model
 */

export interface BookingState {
  flights: Flight[];
  basket: unknown;
  user: { passengerId: number; username: string };
  tickets: Record<number, { passengerId: number; flightId: number }>;
  ticketIds: number[];
}

export const initialState: BookingState = {
  flights: [],
  basket: {},
  user: { passengerId: 1, username: 'jane.doe' },
  tickets: {
    1: { passengerId: 1, flightId: 163 },
    2: { passengerId: 1, flightId: 165 }
  },
  ticketIds: [2, 1]
};

/**
 * Feature
 *  - Reducer
 *  - Selectors
 */

export const bookingFeature = createFeature({
  name: 'booking',
  reducer: createReducer(
    initialState,

    on(bookingActions.flightsLoaded, (state, action) => {
      return {
        ...state,
        flights: action.flights
      };
    })
  ),
  extraSelectors: ({
    selectUser,
    selectFlights,
    selectTickets
  }) => ({
    selectActiveUserFlights: createSelector(
      // Selectors
      selectUser,
      selectFlights,
      selectTickets,
      // Projector
      (user, flights, tickets) => {
        const activeUserPassengerId = user.passengerId;
        const activeUserFlightIds = Object.values(tickets)
          .filter(ticket => ticket.passengerId === activeUserPassengerId)
          .map(ticket => ticket.flightId);

        return flights
          .filter(flight => activeUserFlightIds.includes(flight.id));
      }
    ),
    selectActiveFlight: createSelector(
      selectFlights,
      routerFeature.selectRouteParams,
      (flights, params) =>
        flights.find(f => f.id === +params['id'])
    )
  })
});

/**
 * Effects
 */

export const loadFlights$ = createEffect((
  actions = inject(Actions),
  flightService = inject(FlightService)
) => actions.pipe(
  ofType(bookingActions.flightsLoad),
  switchMap(action => flightService.find(action.from, action.to)),
  map(flights => bookingActions.flightsLoaded({ flights }))
), { functional: true });

export const saveFlight$ = createEffect((
  actions = inject(Actions),
  flightService = inject(FlightService)
) => actions.pipe(
  ofType(bookingActions.flightSave),
  switchMap(action => flightService.save(action.flight)),
), { functional: true, dispatch: false });

/**
 * Provider
 */

export function provideBookingFeature(): EnvironmentProviders[] {
  return [
    provideState(bookingFeature),
    provideEffects({ loadFlights$, saveFlight$ })
  ];
}

/**
 * Facade
 */

export function injectBookingFeature() {
  const store = inject(Store);

  return {
    flights$: store.select(bookingFeature.selectFlights),
    activeFlight$: store.select(bookingFeature.selectActiveFlight).pipe(
      filter(f => !!f)
    ) as Observable<Flight>,
    search: (from: string, to: string) => store.dispatch(
      bookingActions.flightsLoad({ from, to })
    ),
    save: (flight: Flight) => store.dispatch(
      bookingActions.flightSave({ flight })
    )
  };
}
