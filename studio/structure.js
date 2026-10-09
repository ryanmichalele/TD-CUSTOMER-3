export const structure = (S) =>
  S.list()
    .title('TreasuryDirect')
    .items([
      S.listItem()
        .title('Account Holders (by Name)')
        .child(
          S.documentList()
            .title('All Users')
            .filter('_type == "accountHolder"')
            .defaultOrdering([{ field: 'lastName', direction: 'asc' }])
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== 'accountHolder'
      ),
    ]);
