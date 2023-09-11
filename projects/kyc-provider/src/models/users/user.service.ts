import { type IUser, User, UserFirestore } from '@local/common';
import {
	Firestore,
	collection,
	collectionGroup,
	query,
	QueryConstraint,
	doc,
	getDoc,
	getDocs,
	serverTimestamp,
	addDoc
} from 'firebase/firestore';

export class UserService {
	constructor(private readonly firestore: Firestore) {}

	collection() {
		const ref = collection(this.firestore, UserFirestore.collectionPath());

		return ref.withConverter(UserFirestore.converter);
	}

	collectionQuery(queryConstraints: QueryConstraint[]) {
		const ref = collection(this.firestore, UserFirestore.collectionPath());

		return query(ref, ...queryConstraints).withConverter(UserFirestore.converter);
	}

	collectionGroup() {
		const ref = collectionGroup(this.firestore, UserFirestore.collectionId);

		return ref.withConverter(UserFirestore.converter);
	}

	collectionGroupQuery(queryConstraints: QueryConstraint[]) {
		const ref = collectionGroup(this.firestore, UserFirestore.collectionId);

		return query(ref, ...queryConstraints).withConverter(UserFirestore.converter);
	}

	document(id: string) {
		const ref = collection(this.firestore, UserFirestore.collectionPath());

		return doc(this.firestore, ref.path, id).withConverter(UserFirestore.converter);
	}

	get(id: string) {
		return getDoc(this.document(id)).then((snapshot) => {
			console.log(snapshot);
			return snapshot.data() as User;
		});
	}

	list() {
		return getDocs(this.collection()).then((snapshots) =>
			snapshots.docs.map((doc) => doc.data() as User)
		);
	}

	listGroup() {
		return getDocs(this.collectionGroup()).then((snapshots) =>
			snapshots.docs.map((doc) => doc.data() as User)
		);
	}

	async create(data: IUser) {
		const now = serverTimestamp();

		const user = new User(
			'',
			data.auth_uid,
			data.name,
			data.image_url,
			data.client_id,
			now as any,
			now as any
		);

		const doc = await addDoc(this.collection(), user);

		return doc.id;
	}

	authUidMapDocument(authUid: string) {
		const ref = collection(this.firestore, 'auth_uid_maps');

		return doc(this.firestore, ref.path, authUid);
	}

	async userIdByAuthUid(authUid: string) {
		const snapshot = await getDoc(this.authUidMapDocument(authUid));
		const userId = snapshot.data()?.['user_id'] as string | undefined;

		return userId;
	}
}
