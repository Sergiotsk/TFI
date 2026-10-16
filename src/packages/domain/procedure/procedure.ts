export class Procedure {
  constructor(
    readonly id: string,
    readonly userId: string,
    readonly state: 'INICIADO' | 'EN PROCESO' | 'APROBADO' | 'RECHAZADO',
  ) {}
}
