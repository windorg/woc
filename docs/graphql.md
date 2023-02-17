# GraphQL notes

## Card visibility checking

1. When fetching a `Card`, Pothos will always include all card fields, even though `...query` makes it look like only specific fields will be selected.

2. Additionally, when returning a `Card`, Pothos will always check its visibility (see `authScopes`).

3. If you forget to filter by `canSeeCard`, the user will see `Not authorized to read fields for Card`.

4. So you have to filter by `canSeeCard` regardless, but at least you're protected from accidentally leaking private cards.

## Limited-access fields

It's annoying to do a separate query for private fields, and makes the app feel slower. So we have a convention that if a field is private, it will be `null` if the user is not allowed to access it.

Fields that currently follow this convention:
  - `Card.beeminderGoal`
  - `User.betaAccess`

Fields that don't yet follow this convention:
  - `User.beeminderUsername`
  - `User.email`
  - everything else 

## Dates

Due to <https://github.com/apollographql/apollo-client/issues/8857>, we can't use `Date` with apollo-client yet, so we have to use `string`.