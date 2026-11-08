declare namespace App {
    interface Locals {
        session?: import('better-auth').Session;
        user?: import('better-auth').User;
    }
}
