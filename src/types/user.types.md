los tipos de los usuarios

interface User {
id: number;
name: string;
email: string;
password: string;
role: 'admin' | 'user';
createdAt: Date;
updatedAt: Date;
}
