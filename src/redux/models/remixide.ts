import { toast } from 'react-toastify';
import { type ModelType } from '../store';
import remixClient from '../../remix-client';
import { router } from '../../App';

function getFilePath(file: string): string {
  const name = file.split('/');
  return name.length > 1 ? `${name[name.length - 1]}` : '';
}

const Model: ModelType = {
  namespace: 'remixide',
  state: {
    status: 'connecting',
    errors: [],
    success: false,
    errorLoadingFile: false,
  },
  reducers: {
    save(state, { payload }) {
      return { ...state, ...payload };
    },
  },
  effects: {
    *connect(_, { put }) {
      toast.info('connecting to the REMIX IDE');

      yield put({
        type: 'loading/save',
        payload: {
          screen: true,
        },
      });

      yield remixClient.onload();

      yield put({
        type: 'remixide/save',
        payload: {
          status: 'connected',
        },
      });

      toast.dismiss();

      yield put({
        type: 'loading/save',
        payload: {
          screen: false,
        },
      });

      yield router.navigate('/home');
    },
    *displayFile({ payload: step }, { select, put }) {
      const { detail, selectedId } = yield select((state) => state.workshop);

      const workshop = detail[selectedId];
      console.log('loading ', step, workshop);
      let content = '';
      let path = '';
      if (step.solidity?.file) {
        content = step.solidity.content;
        path = getFilePath(step.solidity.file);
      }
      if (step.js?.file) {
        content = step.js.content;
        path = getFilePath(step.js.file);
      }
      if (step.vy?.file) {
        content = step.vy.content;
        path = getFilePath(step.vy.file);
      }

      if (!content) {
        return;
      }

      path = `.learneth/${workshop.name}/${step.name}/${path}`;
      try {
        const isExist = yield remixClient.call(
          'fileManager',
          'exists' as any,
          path,
        );
        if (!isExist) {
          yield remixClient.call('fileManager', 'setFile', path, content);
        }
        yield remixClient.call('fileManager', 'switchFile', `${path}`);
        yield put({
          type: 'remixide/save',
          payload: { errorLoadingFile: false },
        });
      } catch (error) {
        yield put({
          type: 'remixide/save',
          payload: { errorLoadingFile: true },
        });
      }
    },
    *testStep({ payload: step }, { select, put }) {
      try {
        yield put({
          type: 'remixide/save',
          payload: { success: false },
        });
        const { detail, selectedId } = yield select((state) => state.workshop);

        const workshop = detail[selectedId];

        let path: string;
        if (step.solidity.file) {
          path = getFilePath(step.solidity.file);
          path = `.learneth/${workshop.name}/${step.name}/${path}`;
          yield remixClient.call('fileManager', 'switchFile', `${path}`);
        }

        console.log('testing ', step.test.content);

        path = getFilePath(step.test.file);
        path = `.learneth/${workshop.name}/${step.name}/${path}`;
        yield remixClient.call(
          'fileManager',
          'setFile',
          path,
          step.test.content,
        );

        const result = yield remixClient.call(
          'solidityUnitTesting',
          'testFromPath',
          path,
        );
        console.log('result ', result);

        if (!result) {
          yield put({
            type: 'remixide/save',
            payload: { errors: ['Compiler failed to test this file'] },
          });
        } else {
          const success = result.totalFailing === 0;

          if (success) {
            yield put({
              type: 'remixide/save',
              payload: { errors: [], success: true },
            });
          } else {
            yield put({
              type: 'remixide/save',
              payload: { errors: result.errors },
            });
          }
        }
      } catch (err) {
        console.log('TESTING ERROR', err);
        yield put({
          type: 'remixide/save',
          payload: { errors: [String(err)] },
        });
      }
    },
    *showAnswer({ payload: step }, { select, put }) {
      try {
        console.log('loading ', step);
        const content = step.answer.content;
        let path = getFilePath(step.answer.file);

        const { detail, selectedId } = yield select((state) => state.workshop);

        const workshop = detail[selectedId];
        path = `.learneth/${workshop.name}/${step.name}/${path}`;
        yield remixClient.call('fileManager', 'setFile', path, content);
        yield remixClient.call('fileManager', 'switchFile', `${path}`);
      } catch (err) {
        yield put({
          type: 'remixide/save',
          payload: { errors: [String(err)] },
        });
      }
    },
    *startTutorial({ payload: { name, branch, dataId } }, { put, select }) {
      if (['/list', '/detail'].includes(location.pathname)) {
        yield router.navigate('/home');
      }

      yield put({
        type: 'workshop/loadRepo',
        payload: { name, branch },
      });

      if (dataId) {
        const { detail, selectedId } = yield select((state) => state.workshop);
        const { ids, entities } = detail[selectedId];
        for (let i = 0; i < ids.length; i++) {
          if (entities[ids[i]].metadata.data.id === dataId) {
            yield router.navigate(`/list?id=${ids[i]}`);
            break;
          }
        }
      }
    },
    *testSolidityCompiler(_, { put, select }) {
      try {
        yield remixClient.call('solidity', 'getCompilationResult');
      } catch (err) {
        const errors = yield select((state) => state.remixide.errors);
        yield put({
          type: 'remixide/save',
          payload: {
            errors: [
              ...errors,
              "The `Solidity Compiler` is not yet activated.<br>Please activate it using the `SOLIDITY` button in the `Featured Plugins` section of the homepage.<img class='img-thumbnail mt-3' src='assets/activatesolidity.png'>",
            ],
          },
        });
      }
    },
  },
};

export default Model;
