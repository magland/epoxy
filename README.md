# epoxy

Sort of like binder, sort of like repo2docker.

## What does it do?

Epoxy can be used in two ways.

In the first usage, much like docker2repo, it takes as input a repository or local source directory and builds and runs a docker container with environment inferred from the contents of the repository. It then opens a jupyterlab or other interactive session to interact with the source code. Unlike docker2repo, if the input is a directory on the local machine, the directory can be mounted in the container and therefore the source files can be edited both inside and outside the container.

In the second usage, much like binder, it is a web server that provides, on demand, the same live, interactive session in a web browser without installing any software locally.

## Prerequisites

* docker, and [make sure your user is in the docker group](https://docs.docker.com/install/linux/linux-postinstall/)
* nodejs -- a recent version
* If you are going to use the --mount option as described below, you will want to configure docker to map the container's root user to the host's non-root user. See below.

## Installation
```
git clone git@github.com:magland/epoxy.git
cd epoxy
npm install
```

## Example usage

*NOTE: the following are not yet implemented -- I am writing the docs first.*

Launch an interactive jupyter session for a remote git repository:

```
epoxy-run-jupyterlab https://github.com/flatironinstitute/mountainsort_examples
```

Launch an interactive jupyter session for a local directory:

```
epoxy-run-jupyterlab /home/magland/src/mountainsort_examples
```

Same, except mount the local directory so that source files may be edited both inside and outside the container:

```
epoxy-run-jupyterlab /home/magland/src/mountainsort_examples --mount
```

*Note: when using the --mount option, you will almost certainly want the user in the container to correspond to your non-root user on the host. To configure docker to do this, see the relevant section below.*

You can also launch other types of interactive sessions such as bash:

```
epoxy-run-bash https://github.com/flatironinstitute/mountainsort_examples
```

## Notes

Right now, epoxy expects the following two files in the repository:

```
environment.yml
postBuild
```

Ultimately it will support the other ways of specifying the environment (used by repo2docker and binder).

## User permissions

If you use the --mount option, then you will almost certainly want the docker container to act as your non-root user when it modifies files in the workspace. This requires a special docker configuration on your local machine. The following instructions are based on this excellent guide: https://blog.yadutaf.fr/2016/04/14/docker-for-your-users-introducing-user-namespace/

You'll need to know your user name and uid. These can be obtained via:

```
echo $USER
echo $UID
```

Suppose your user name is `[user]` and your uid is `[uid]`.

Do the following:

```
cat /etc/subuid
```

You should see something like

```
[user]:165536:65536
```

where `[user]` is your user name. Depending on the other users on the system, the 165536 might be a different number -- that's okay. Now edit this file

```
sudo nano /etc/subuid
```

You will need to insert a line before the entry and decrement the final 65536 by 1 to get 65535. So in the above example you would get

```
[user]:[uid]:1
[user]:165536:65535
```

Now do the same thing for `/etc/subgid`:

```
sudo nano /etc/subgid
```

Next, configure docker to map the root user in the container to `[user]` on the host:

```
sudo nano /etc/docker/daemon.json
```

and (assuming it was empty before), set the contents to

```
{
        "userns-remap": "[user]"
}
```

Again, `[user]` is your user name. Now restart the docker daemon:

```
sudo systemctl restart docker
```

Now, the root user within docker containers will correspond to your non-root user on the host.







