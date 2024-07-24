# Third Party Notices (License Book)

Up to date third party notices for the application can be generated via the `license-book` task, shipped with the project:

```sh
$ node tasks/license-book.js --help
usage: node tasks/license-book.js [-o FILE_NAME] [-c]

Analyze and/or generate license book/third party notices.

Options:

  -o, --output=FILE_NAME        write to FILE_NAME
  -c, --commit                  commit book

  -h, --help                    print this help
```

The file `THIRD_PARTY_NOTICES` that contains the license information is automatically updated as a pre-release step. You may trigger it manually, too:

```sh
$ npm run pre-release
```
