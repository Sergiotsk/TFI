export class User {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly lastname: string,
    readonly email: string,
    readonly password: string,
    readonly dni: string,
    readonly birthdate: Date,
    readonly sex: 'M' | 'F' | 'O',
    readonly phone: string,
    readonly address: string,
    readonly role: 'INTERESADO' | 'SECRETARIO' | 'DIRECTOR' | 'ADMIN',
  ) {}
}
