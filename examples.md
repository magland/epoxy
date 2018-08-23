### JupyterLab session based on remote repository:

```
epoxy-jupyterlab https://github.com/magland/test_capsule1 --install_jupyterlab
```

Note that the `--install_jupyterlab` flag must be added if the environment does not already include jupyterlab.

### Bash session based on remote repository:

```
epoxy-bash https://github.com/magland/test_capsule1
```

### Run a capsule in a remote repository:

```
epoxy-run https://github.com/magland/test_capsule1 --results=test_results
```

### JupyterLab session based on local directory:

```
git clone https://github.com/magland/test_capsule1
epoxy-jupyterlab test_capsule1 --install_jupyterlab
```

### Open JupyterLab session via epoxyhub:

```
http://epoxyhub.org/?source=https://github.com/magland/test_capsule1
```

