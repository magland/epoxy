# epoxy

Sort of like binder.

## What does it do?

It provides a jupyter lab session based on a source code repository, with the conda environment created from environment.yml and a postBuild script.

## Prerequisites

* docker, and make sure your user is in the docker group
* nodejs -- a recent version

## Installation
```
git clone git@github.com:magland/epoxy.git
cd epoxy
npm install
```

## Example usage

```
epoxy https://github.com/flatironinstitute/mountainsort_examples
```

You'll need to wait for it to build the first time.

Then point your web browser to:

```
http://localhost:8000/lab
```

or substitute the relevant port as indicated in the console output.

## Notes

Right now, epoxy expects the following two files in the repository:

```
environment.yml
postBuild
```

You can also use a local directory rather than a github url.
