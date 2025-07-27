'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { adminAPI } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './edit.module.css';
import { SkillEffects } from '@/lib/types';

interface Pet {
  _id: string;
  name: string;
  img: string;
  description: string;
  element: string;
  rarity: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  isActive: boolean;
  isStarter: boolean;
  normalSkill?: Skill;
  ultimateSkill?: Skill;
  passiveSkill?: Skill;
}

interface Skill {
  _id: string;
  name: string;
  description: string;
  type: string;
  element: string;
  power?: number;
  energyCost?: number;
  accuracy?: number;
  criticalRate?: number;
  effects?: SkillEffects;
  petId: string;
  skillSetId: string;
  isActive: boolean;
  createdAt: string;
}

export default function EditPet() {
  const { getToken, isAdmin } = useAuthContext();
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pet, setPet] = useState<Pet | null>(null);
  const [skills, setSkills] = useState<{
    normal?: Skill;
    ultimate?: Skill;
    passive?: Skill;
  }>({});
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    power: 0,
    energyCost: 0,
    accuracy: 100,
    criticalRate: 0,
    effects: {} as SkillEffects
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadPet();
    loadSkills();
  }, [mounted, petId]);

  const loadPet = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError('Không có token xác thực');
        setLoading(false);
        return;
      }

      const data = await adminAPI.getPet(token, petId);
      setPet(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải thông tin linh thú');
      console.error('Load pet error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const data = await adminAPI.getPetSkillSet(token, petId);
      setSkills(data);
    } catch (err: any) {
      console.error('Load skills error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!pet) return;
    
    const { name, value } = e.target;
    setPet(prev => prev ? {
      ...prev,
      [name]: name.includes('base') ? parseInt(value) || 0 : value
    } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet) return;

    setSaving(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setError('Không có token xác thực');
        return;
      }

      await adminAPI.updatePet(token, petId, pet);
      router.push('/admin/pets');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật linh thú');
      console.error('Update pet error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setEditForm({
      name: skill.name,
      description: skill.description,
      power: skill.power || 0,
      energyCost: skill.energyCost || 0,
      accuracy: skill.accuracy || 100,
      criticalRate: skill.criticalRate || 0,
      effects: skill.effects || {}
    });
    setShowEditForm(true);
  };

  const handleUpdateSkill = async () => {
    if (!editingSkill) return;

    try {
      const token = getToken();
      if (!token) {
        setError('Không có token xác thực');
        return;
      }

      await adminAPI.updateSkill(token, editingSkill._id, editForm);
      setShowEditForm(false);
      setEditingSkill(null);
      loadSkills();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật skill');
      console.error('Update skill error:', err);
    }
  };

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Không có quyền truy cập</h2>
          <p>Bạn cần quyền admin để truy cập trang này.</p>
          <Link href="/" className={styles.button}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Đang tải thông tin linh thú...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Không tìm thấy linh thú</h2>
          <p>Linh thú bạn đang tìm kiếm không tồn tại.</p>
          <Link href="/admin/pets" className={styles.button}>
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Chỉnh sửa Linh thú</h1>
        <Link href="/admin/pets" className={styles.backButton}>
          ← Quay lại
        </Link>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError('')} className={styles.closeError}>×</button>
        </div>
      )}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Tên linh thú *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={pet.name}
              onChange={handleInputChange}
              required
              placeholder="Nhập tên linh thú..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="img">URL hình ảnh *</label>
            <input
              type="url"
              id="img"
              name="img"
              value={pet.img}
              onChange={handleInputChange}
              required
              placeholder="https://example.com/pet-image.jpg"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={pet.description || ''}
              onChange={handleInputChange}
              rows={3}
              placeholder="Mô tả về linh thú..."
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="element">Hệ *</label>
              <select
                id="element"
                name="element"
                value={pet.element}
                onChange={handleInputChange}
                required
              >
                <option value="fire">Hỏa</option>
                <option value="water">Thủy</option>
                <option value="wind">Phong</option>
                <option value="thunder">Lôi</option>
                <option value="ice">Băng</option>
                <option value="grass">Thảo</option>
                <option value="rock">Nham</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="rarity">Độ hiếm *</label>
              <select
                id="rarity"
                name="rarity"
                value={pet.rarity}
                onChange={handleInputChange}
                required
              >
                <option value="common">Thường</option>
                <option value="rare">Hiếm</option>
                <option value="epic">Siêu hiếm</option>
                <option value="legendary">Huyền thoại</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isStarter"
                checked={pet.isStarter}
                onChange={(e) => setPet(prev => prev ? {
                  ...prev,
                  isStarter: e.target.checked
                } : null)}
              />
              🌟 Linh thú mở đầu (Starter Pet)
            </label>
            <small>Đánh dấu linh thú này là lựa chọn mở đầu cho người dùng mới</small>
          </div>

          <div className={styles.statsSection}>
            <h3>Chỉ số cơ bản</h3>
            <div className={styles.statsGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="baseHp">HP</label>
                <input
                  type="number"
                  id="baseHp"
                  name="baseHp"
                  value={pet.baseHp}
                  onChange={handleInputChange}
                  min="1"
                  max="9999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseAttack">Tấn công</label>
                <input
                  type="number"
                  id="baseAttack"
                  name="baseAttack"
                  value={pet.baseAttack}
                  onChange={handleInputChange}
                  min="1"
                  max="999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseDefense">Phòng thủ</label>
                <input
                  type="number"
                  id="baseDefense"
                  name="baseDefense"
                  value={pet.baseDefense}
                  onChange={handleInputChange}
                  min="1"
                  max="999"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="baseSpeed">Tốc độ</label>
                <input
                  type="number"
                  id="baseSpeed"
                  name="baseSpeed"
                  value={pet.baseSpeed}
                  onChange={handleInputChange}
                  min="1"
                  max="999"
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => router.push('/admin/pets')}
              className={styles.cancelButton}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* Skills Section */}
      <div className={styles.skillsSection}>
        <div className={styles.skillsHeader}>
          <h3>Kỹ năng của linh thú</h3>
        </div>

        {/* Skills List */}
        {Object.keys(skills).length > 0 ? (
          <div className={styles.skillsList}>
            {skills.normal && (
              <div className={styles.skillCard}>
                <div className={styles.skillHeader}>
                  <h4>Normal Skill</h4>
                  <button
                    onClick={() => handleEditSkill(skills.normal!)}
                    className={styles.editSkillButton}
                  >
                    ✏️ Sửa
                  </button>
                </div>
                <div className={styles.skillInfo}>
                  <p><strong>Tên:</strong> {skills.normal.name}</p>
                  <p><strong>Mô tả:</strong> {skills.normal.description}</p>
                  <div className={styles.skillStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>⚔️ Power:</span>
                      <span className={styles.statValue}>{skills.normal.power}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>⚡ Energy:</span>
                      <span className={styles.statValue}>{skills.normal.energyCost}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>🎯 Accuracy:</span>
                      <span className={styles.statValue}>{skills.normal.accuracy}%</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>💥 Crit:</span>
                      <span className={styles.statValue}>{skills.normal.criticalRate}%</span>
                    </div>
                  </div>
                  
                  {/* Effects Display */}
                  {skills.normal.effects && (
                    <div className={styles.effectsDisplay}>
                      <h6>Hiệu ứng:</h6>
                      
                      {/* Status Effects */}
                      {skills.normal.effects.status && Object.entries(skills.normal.effects.status).some(([_, active]) => active) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Status:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.normal.effects.status).map(([effect, active]) => 
                              active && (
                                <span key={effect} className={styles.effectTag}>
                                  {effect === 'stun' && '💫 Stun'}
                                  {effect === 'poison' && '☠️ Poison'}
                                  {effect === 'burn' && '🔥 Burn'}
                                  {effect === 'freeze' && '❄️ Freeze'}
                                  {effect === 'paralyze' && '⚡ Paralyze'}
                                  {effect === 'sleep' && '😴 Sleep'}
                                  {effect === 'confusion' && '💫 Confusion'}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Special Effects */}
                      {skills.normal.effects.special && Object.entries(skills.normal.effects.special).some(([_, value]) => value && value !== 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Special:</span>
                          <div className={styles.effectsList}>
                            {skills.normal.effects.special.heal && skills.normal.effects.special.heal > 0 && (
                              <span className={styles.effectTag}>💚 Heal {skills.normal.effects.special.heal}%</span>
                            )}
                            {skills.normal.effects.special.drain && skills.normal.effects.special.drain > 0 && (
                              <span className={styles.effectTag}>🩸 Drain {skills.normal.effects.special.drain}%</span>
                            )}
                            {skills.normal.effects.special.reflect && (
                              <span className={styles.effectTag}>🪞 Reflect</span>
                            )}
                            {skills.normal.effects.special.counter && (
                              <span className={styles.effectTag}>↩️ Counter</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Buff Effects */}
                      {skills.normal.effects.buff && Object.entries(skills.normal.effects.buff).some(([_, level]) => level > 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Buff:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.normal.effects.buff).map(([stat, level]) => 
                              level > 0 && (
                                <span key={stat} className={styles.effectTag}>
                                  {stat === 'attack' && '⚔️'}
                                  {stat === 'defense' && '🛡️'}
                                  {stat === 'speed' && '⚡'}
                                  {stat === 'accuracy' && '🎯'}
                                  {stat === 'evasion' && '👻'}
                                  {stat === 'criticalRate' && '💥'}
                                  +{level}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Debuff Effects */}
                      {skills.normal.effects.debuff && Object.entries(skills.normal.effects.debuff).some(([_, level]) => level > 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Debuff:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.normal.effects.debuff).map(([stat, level]) => 
                              level > 0 && (
                                <span key={stat} className={styles.effectTag}>
                                  {stat === 'attack' && '⚔️'}
                                  {stat === 'defense' && '🛡️'}
                                  {stat === 'speed' && '⚡'}
                                  {stat === 'accuracy' && '🎯'}
                                  {stat === 'evasion' && '👻'}
                                  {stat === 'criticalRate' && '💥'}
                                  -{level}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {skills.ultimate && (
              <div className={styles.skillCard}>
                <div className={styles.skillHeader}>
                  <h4>Ultimate Skill</h4>
                  <button
                    onClick={() => handleEditSkill(skills.ultimate!)}
                    className={styles.editSkillButton}
                  >
                    ✏️ Sửa
                  </button>
                </div>
                <div className={styles.skillInfo}>
                  <p><strong>Tên:</strong> {skills.ultimate.name}</p>
                  <p><strong>Mô tả:</strong> {skills.ultimate.description}</p>
                  <div className={styles.skillStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>⚔️ Power:</span>
                      <span className={styles.statValue}>{skills.ultimate.power}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>⚡ Energy:</span>
                      <span className={styles.statValue}>{skills.ultimate.energyCost}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>🎯 Accuracy:</span>
                      <span className={styles.statValue}>{skills.ultimate.accuracy}%</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>💥 Crit:</span>
                      <span className={styles.statValue}>{skills.ultimate.criticalRate}%</span>
                    </div>
                  </div>
                  
                  {/* Effects Display for Ultimate Skill */}
                  {skills.ultimate.effects && (
                    <div className={styles.effectsDisplay}>
                      <h6>Hiệu ứng:</h6>
                      
                      {/* Status Effects */}
                      {skills.ultimate.effects.status && Object.entries(skills.ultimate.effects.status).some(([_, active]) => active) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Status:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.ultimate.effects.status).map(([effect, active]) => 
                              active && (
                                <span key={effect} className={styles.effectTag}>
                                  {effect === 'stun' && '💫 Stun'}
                                  {effect === 'poison' && '☠️ Poison'}
                                  {effect === 'burn' && '🔥 Burn'}
                                  {effect === 'freeze' && '❄️ Freeze'}
                                  {effect === 'paralyze' && '⚡ Paralyze'}
                                  {effect === 'sleep' && '😴 Sleep'}
                                  {effect === 'confusion' && '💫 Confusion'}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Special Effects */}
                      {skills.ultimate.effects.special && Object.entries(skills.ultimate.effects.special).some(([_, value]) => value && value !== 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Special:</span>
                          <div className={styles.effectsList}>
                            {skills.ultimate.effects.special.heal && skills.ultimate.effects.special.heal > 0 && (
                              <span className={styles.effectTag}>💚 Heal {skills.ultimate.effects.special.heal}%</span>
                            )}
                            {skills.ultimate.effects.special.drain && skills.ultimate.effects.special.drain > 0 && (
                              <span className={styles.effectTag}>🩸 Drain {skills.ultimate.effects.special.drain}%</span>
                            )}
                            {skills.ultimate.effects.special.reflect && (
                              <span className={styles.effectTag}>🪞 Reflect</span>
                            )}
                            {skills.ultimate.effects.special.counter && (
                              <span className={styles.effectTag}>↩️ Counter</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Buff Effects */}
                      {skills.ultimate.effects.buff && Object.entries(skills.ultimate.effects.buff).some(([_, level]) => level > 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Buff:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.ultimate.effects.buff).map(([stat, level]) => 
                              level > 0 && (
                                <span key={stat} className={styles.effectTag}>
                                  {stat === 'attack' && '⚔️'}
                                  {stat === 'defense' && '🛡️'}
                                  {stat === 'speed' && '⚡'}
                                  {stat === 'accuracy' && '🎯'}
                                  {stat === 'evasion' && '👻'}
                                  {stat === 'criticalRate' && '💥'}
                                  +{level}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Debuff Effects */}
                      {skills.ultimate.effects.debuff && Object.entries(skills.ultimate.effects.debuff).some(([_, level]) => level > 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Debuff:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.ultimate.effects.debuff).map(([stat, level]) => 
                              level > 0 && (
                                <span key={stat} className={styles.effectTag}>
                                  {stat === 'attack' && '⚔️'}
                                  {stat === 'defense' && '🛡️'}
                                  {stat === 'speed' && '⚡'}
                                  {stat === 'accuracy' && '🎯'}
                                  {stat === 'evasion' && '👻'}
                                  {stat === 'criticalRate' && '💥'}
                                  -{level}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {skills.passive && (
              <div className={styles.skillCard}>
                <div className={styles.skillHeader}>
                  <h4>Passive Skill</h4>
                  <button
                    onClick={() => handleEditSkill(skills.passive!)}
                    className={styles.editSkillButton}
                  >
                    ✏️ Sửa
                  </button>
                </div>
                <div className={styles.skillInfo}>
                  <p><strong>Tên:</strong> {skills.passive.name}</p>
                  <p><strong>Mô tả:</strong> {skills.passive.description}</p>
                  
                  {/* Effects Display for Passive Skill */}
                  {skills.passive.effects && (
                    <div className={styles.effectsDisplay}>
                      <h6>Hiệu ứng:</h6>
                      
                      {/* Status Effects */}
                      {skills.passive.effects.status && Object.entries(skills.passive.effects.status).some(([_, active]) => active) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Status:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.passive.effects.status).map(([effect, active]) => 
                              active && (
                                <span key={effect} className={styles.effectTag}>
                                  {effect === 'stun' && '💫 Stun'}
                                  {effect === 'poison' && '☠️ Poison'}
                                  {effect === 'burn' && '🔥 Burn'}
                                  {effect === 'freeze' && '❄️ Freeze'}
                                  {effect === 'paralyze' && '⚡ Paralyze'}
                                  {effect === 'sleep' && '😴 Sleep'}
                                  {effect === 'confusion' && '💫 Confusion'}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Special Effects */}
                      {skills.passive.effects.special && Object.entries(skills.passive.effects.special).some(([_, value]) => value && value !== 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Special:</span>
                          <div className={styles.effectsList}>
                            {skills.passive.effects.special.heal && skills.passive.effects.special.heal > 0 && (
                              <span className={styles.effectTag}>💚 Heal {skills.passive.effects.special.heal}%</span>
                            )}
                            {skills.passive.effects.special.drain && skills.passive.effects.special.drain > 0 && (
                              <span className={styles.effectTag}>🩸 Drain {skills.passive.effects.special.drain}%</span>
                            )}
                            {skills.passive.effects.special.reflect && (
                              <span className={styles.effectTag}>🪞 Reflect</span>
                            )}
                            {skills.passive.effects.special.counter && (
                              <span className={styles.effectTag}>↩️ Counter</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Buff Effects */}
                      {skills.passive.effects.buff && Object.entries(skills.passive.effects.buff).some(([_, level]) => level > 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Buff:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.passive.effects.buff).map(([stat, level]) => 
                              level > 0 && (
                                <span key={stat} className={styles.effectTag}>
                                  {stat === 'attack' && '⚔️'}
                                  {stat === 'defense' && '🛡️'}
                                  {stat === 'speed' && '⚡'}
                                  {stat === 'accuracy' && '🎯'}
                                  {stat === 'evasion' && '👻'}
                                  {stat === 'criticalRate' && '💥'}
                                  +{level}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Debuff Effects */}
                      {skills.passive.effects.debuff && Object.entries(skills.passive.effects.debuff).some(([_, level]) => level > 0) && (
                        <div className={styles.effectsGroup}>
                          <span className={styles.effectsLabel}>Debuff:</span>
                          <div className={styles.effectsList}>
                            {Object.entries(skills.passive.effects.debuff).map(([stat, level]) => 
                              level > 0 && (
                                <span key={stat} className={styles.effectTag}>
                                  {stat === 'attack' && '⚔️'}
                                  {stat === 'defense' && '🛡️'}
                                  {stat === 'speed' && '⚡'}
                                  {stat === 'accuracy' && '🎯'}
                                  {stat === 'evasion' && '👻'}
                                  {stat === 'criticalRate' && '💥'}
                                  -{level}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noSkills}>
            <p>Linh thú này chưa có kỹ năng nào.</p>
          </div>
        )}

        {/* Edit Skill Modal */}
        {showEditForm && editingSkill && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Sửa {editingSkill.type === 'normal' ? 'Normal' : editingSkill.type === 'ultimate' ? 'Ultimate' : 'Passive'} Skill</h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingSkill(null);
                  }}
                  className={styles.closeModal}
                >
                  ×
                </button>
              </div>
              
              <div className={styles.skillForm}>
                <div className={styles.skillTypeSection}>
                  <h4>{editingSkill.type === 'normal' ? 'Normal' : editingSkill.type === 'ultimate' ? 'Ultimate' : 'Passive'} Skill</h4>
                  <input
                    type="text"
                    placeholder="Tên skill"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                  />
                  <textarea
                    placeholder="Mô tả"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                  />
                  {editingSkill.type !== 'passive' && (
                    <>
                      <input
                        type="number"
                        placeholder="Power"
                        value={editForm.power}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          power: parseInt(e.target.value) || 0
                        }))}
                      />
                      <input
                        type="number"
                        placeholder="Energy Cost"
                        value={editForm.energyCost}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          energyCost: parseInt(e.target.value) || 0
                        }))}
                      />
                      <input
                        type="number"
                        placeholder="Accuracy (%)"
                        value={editForm.accuracy}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          accuracy: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                        max="100"
                      />
                      <input
                        type="number"
                        placeholder="Critical Rate (%)"
                        value={editForm.criticalRate}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          criticalRate: parseInt(e.target.value) || 0
                        }))}
                        min="0"
                        max="100"
                      />
                    </>
                  )}
                </div>

                {/* Effects Section for Edit */}
                <div className={styles.effectsSection}>
                  <h5>Hiệu ứng đặc biệt</h5>
                  
                  {/* Status Effects */}
                  <div className={styles.effectsGroup}>
                    <h6>Status Effects</h6>
                    <div className={styles.effectsGrid}>
                      <label className={styles.effectCheckbox}>
                        <input
                          type="checkbox"
                          checked={editForm.effects?.status?.stun || false}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              status: {
                                ...prev.effects?.status,
                                stun: e.target.checked
                              }
                            }
                          }))}
                        />
                        💫 Stun
                      </label>
                      <label className={styles.effectCheckbox}>
                        <input
                          type="checkbox"
                          checked={editForm.effects?.status?.poison || false}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              status: {
                                ...prev.effects?.status,
                                poison: e.target.checked
                              }
                            }
                          }))}
                        />
                        ☠️ Poison
                      </label>
                      <label className={styles.effectCheckbox}>
                        <input
                          type="checkbox"
                          checked={editForm.effects?.status?.burn || false}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              status: {
                                ...prev.effects?.status,
                                burn: e.target.checked
                              }
                            }
                          }))}
                        />
                        🔥 Burn
                      </label>
                      <label className={styles.effectCheckbox}>
                        <input
                          type="checkbox"
                          checked={editForm.effects?.status?.freeze || false}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              status: {
                                ...prev.effects?.status,
                                freeze: e.target.checked
                              }
                            }
                          }))}
                        />
                        ❄️ Freeze
                      </label>
                    </div>
                  </div>

                  {/* Special Effects */}
                  <div className={styles.effectsGroup}>
                    <h6>Special Effects</h6>
                    <div className={styles.specialEffectsGrid}>
                      <div className={styles.specialEffectInput}>
                        <label>💚 Heal (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.effects?.special?.heal || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              special: {
                                ...prev.effects?.special,
                                heal: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className={styles.specialEffectInput}>
                        <label>🩸 Drain (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.effects?.special?.drain || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              special: {
                                ...prev.effects?.special,
                                drain: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buff Effects */}
                  <div className={styles.effectsGroup}>
                    <h6>Buff Effects</h6>
                    <div className={styles.buffEffectsGrid}>
                      <div className={styles.buffEffectInput}>
                        <label>⚔️ Attack +</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editForm.effects?.buff?.attack || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              buff: {
                                ...prev.effects?.buff,
                                attack: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className={styles.buffEffectInput}>
                        <label>🛡️ Defense +</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editForm.effects?.buff?.defense || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              buff: {
                                ...prev.effects?.buff,
                                defense: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className={styles.buffEffectInput}>
                        <label>⚡ Speed +</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editForm.effects?.buff?.speed || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              buff: {
                                ...prev.effects?.buff,
                                speed: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Debuff Effects */}
                  <div className={styles.effectsGroup}>
                    <h6>Debuff Effects</h6>
                    <div className={styles.buffEffectsGrid}>
                      <div className={styles.buffEffectInput}>
                        <label>⚔️ Attack -</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editForm.effects?.debuff?.attack || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              debuff: {
                                ...prev.effects?.debuff,
                                attack: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className={styles.buffEffectInput}>
                        <label>🛡️ Defense -</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editForm.effects?.debuff?.defense || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              debuff: {
                                ...prev.effects?.debuff,
                                defense: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className={styles.buffEffectInput}>
                        <label>⚡ Speed -</label>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={editForm.effects?.debuff?.speed || 0}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              debuff: {
                                ...prev.effects?.debuff,
                                speed: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingSkill(null);
                    }}
                    className={styles.cancelButton}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdateSkill}
                    className={styles.submitButton}
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 